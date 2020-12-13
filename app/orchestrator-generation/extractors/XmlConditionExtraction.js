import parser from 'fast-xml-parser';
import he from 'he';

function extractXml(xml) {
    return parser.parse(
        xml, {
            attributeNamePrefix: "",
            attrNodeName: "attributes",
            ignoreAttributes: false,
            ignoreNameSpace: false,
            allowBooleanAttributes: false,
            parseNodeValue: true,
            parseAttributeValue: false,
            trimValues: true,
            parseTrueNumberOnly: false,
            arrayMode: false,
            attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),
            tagValueProcessor: (val, tagName) => he.decode(val)
        },
        true
    );
}

export function extractCondition(conditionXml, element) {
    let json = false;

    try {
        json = extractXml(conditionXml);
    } catch (error) {
        throw 'Error when extracting condition - ' + error.message + ' for element with id: ' + element.id;
    }

    let condition = json.condition;

    if (!condition) {
        throw 'Error when extracting condition - undefined condition for element with id: ' + element.id;
    }

    return condition;
}

export function extractBranchConditions(branchConditionsXml, element) {
    let json = false;

    try {
        json = extractXml(branchConditionsXml);
    } catch (error) {
        throw 'Error when extracting branch condition - ' + error.message + ' for element with id: ' + element.id;
    }

    if (!json.branches || !json.branches.branch) {
        throw 'Error when extracting branch condition - undefined branch for element with id: ' + element.id;
    }

    let branchConditions = {};

    if (Array.isArray(json.branches.branch)) {
        for (let b of json.branches.branch) {
            if (!b.condition || !b.attributes.name) {
                throw 'Error when extracting branch condition - undefined condition or branch name for element with id: ' + element.id;
            }

            branchConditions[b.attributes.name] = b.condition;
        }
    } else {
        if (!json.branches.branch.condition || !json.branches.branch.attributes.name) {
            throw 'Error when extracting branch condition - undefined condition or branch name for element with id: ' + element.id;
        }

        branchConditions[json.branches.branch.attributes.name] = json.branches.branch.condition;
    }

    return branchConditions;
}