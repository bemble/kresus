import { makeLogger } from '../helpers';
import AccountTypes from '../shared/account-types.json';

const log = makeLogger('lib/account-types');

// Maps external account type id to name.
const AccountTypeToName = new Map();
for (const { weboobvalue: externalId, name } of AccountTypes) {
    AccountTypeToName.set(`${externalId}`, name);
}

// Returns the name associated to the account type id, or null if not found.
export function accountTypeIdToName(externalId) {
    if (!externalId) {
        return null;
    }

    const externalIdStr = `${externalId}`;
    if (!AccountTypeToName.has(externalIdStr)) {
        log.error(`Error: ${externalIdStr} is undefined, please contact a kresus maintainer`);
        return null;
    }

    return AccountTypeToName.get(externalIdStr);
}

// Returns the external id associated to the account type name, or -1 if not found.
export function accountTypeNameToId(name) {
    const id = AccountTypes.find(type => type.name === name);
    return id ? id.weboobvalue : -1;
}
