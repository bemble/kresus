import { Budget, Category, Transaction } from '../models';
import { makeLogger, KError, asyncErr } from '../helpers';
import { checkExactFields, checkAllowedFields } from '../shared/validators';

const log = makeLogger('controllers/categories');

export async function preloadCategory(req, res, next, id) {
    try {
        const { id: userId } = req.user;
        const category = await Category.find(userId, id);

        if (!category) {
            throw new KError('Category not found', 404);
        }

        req.preloaded = { category };
        return next();
    } catch (err) {
        return asyncErr(res, err, 'when preloading a category');
    }
}

export async function create(req, res) {
    try {
        const { id: userId } = req.user;

        const error = checkExactFields(req.body, ['label', 'color']);
        if (error) {
            throw new KError(`when creating a category: ${error}`, 400);
        }

        const created = await Category.create(userId, req.body);
        res.status(200).json(created);
    } catch (err) {
        return asyncErr(res, err, 'when creating category');
    }
}

export async function update(req, res) {
    try {
        const { id: userId } = req.user;

        const error = checkAllowedFields(req.body, ['label', 'color']);
        if (error) {
            throw new KError(`when updating a category: ${error}`, 400);
        }

        const category = req.preloaded.category;
        const newCat = await Category.update(userId, category.id, req.body);
        res.status(200).json(newCat);
    } catch (err) {
        return asyncErr(res, err, 'when updating a category');
    }
}

export async function destroy(req, res) {
    try {
        const { id: userId } = req.user;

        const error = checkExactFields(req.body, ['replaceByCategoryId']);
        if (error) {
            throw new KError('Missing parameter replaceByCategoryId', 400);
        }

        const former = req.preloaded.category;

        const replaceBy = req.body.replaceByCategoryId;
        if (replaceBy !== null) {
            log.debug(`Replacing category ${former.id} by ${replaceBy}...`);
            const categoryToReplaceBy = await Category.find(userId, replaceBy);
            if (!categoryToReplaceBy) {
                throw new KError('Replacement category not found', 404);
            }
        } else {
            log.debug('No replacement category, replacing by the None category.');
        }
        const categoryId = replaceBy;

        const operations = await Transaction.byCategory(userId, former.id);
        for (const op of operations) {
            await Transaction.update(userId, op.id, { categoryId });
        }

        await Budget.destroyForCategory(userId, former.id, categoryId);

        await Category.destroy(userId, former.id);
        res.status(200).end();
    } catch (err) {
        return asyncErr(res, err, 'when deleting a category');
    }
}