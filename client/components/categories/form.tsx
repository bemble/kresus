import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { get, actions } from '../../store';
import { translate as $t, generateColor, notify } from '../../helpers';
import { ColorPicker, Form, BackLink, ValidatedTextInput } from '../ui';

import URL from './urls';
import { ValidatedTextInputRef } from '../ui/validated-text-input';

const CategoryForm = (props: { id?: string }) => {
    const dispatch = useDispatch();
    const history = useHistory();

    const labelRef = useRef<ValidatedTextInputRef>(null);

    const category = useSelector(state => {
        if (props.id) {
            // Edition mode.
            return get.categoryById(state, props.id);
        }
        // Creation mode.
        return null;
    });

    const initialLabel = category ? category.label : null;
    const initialColor = category ? category.color : generateColor();
    const header = category ? $t('client.category.edition') : $t('client.category.creation');

    const [label, setLabel] = useState(initialLabel);
    const [color, setColor] = useState(initialColor);

    const submit = useCallback(async () => {
        const newFields = {
            label,
            color,
        };

        if (category === null) {
            // Creation mode.
            try {
                await actions.createCategory(dispatch, newFields);
                notify.success($t('client.category.creation_success'));
                history.push(URL.list);
            } catch (error) {
                notify.error($t('client.category.creation_error', { error: error.message }));
            }
            return;
        }

        try {
            await actions.updateCategory(dispatch, category, newFields);
            notify.success($t('client.category.edition_success'));
            history.push(URL.list);
        } catch (error) {
            notify.error($t('client.category.edition_error', { error: error.message }));
        }
    }, [history, dispatch, label, color, category]);

    // On mount, focus on (resp. select in edit mode) the label field.
    useEffect(() => {
        if (labelRef.current) {
            if (category) {
                labelRef.current.select();
            } else {
                labelRef.current.focus();
            }
        }
    }, [category]);

    const submitDisabled = !label || label.length === 0;

    return (
        <Form center={true} onSubmit={submit}>
            <BackLink to={URL.list}>{$t('client.general.cancel')}</BackLink>

            <h3>{header}</h3>

            <Form.Input label={$t('client.category.name')} id="title">
                <ValidatedTextInput ref={labelRef} onChange={setLabel} initialValue={label} />
            </Form.Input>

            <Form.Input label={$t('client.category.color')} id="color">
                <ColorPicker onChange={setColor} defaultValue={color} />
            </Form.Input>

            <input
                type="submit"
                className="btn primary"
                value={$t('client.general.save')}
                disabled={submitDisabled}
            />
        </Form>
    );
};

const EditForm = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    return <CategoryForm id={categoryId} />;
};

const NewForm = CategoryForm;

export { EditForm, NewForm };