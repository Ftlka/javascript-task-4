'use strict';

exports.isStar = true;

const OPERATION_PRIORITY = ['filterIn', 'and', 'or', 'sortBy', 'select', 'limit', 'format'];

const copyCollection = collection => JSON.parse(JSON.stringify(collection));

exports.query = (collection, ...params) => {
    return params
        .sort((a, b) => a.priority - b.priority)
        .reduce((collectionCopy, param) => param.func(collectionCopy), copyCollection(collection));
};

const select = (collection, params) =>
    collection.reduce((result, entry) => {
        const newEntry = params.reduce((element, param) => {
            if (entry[param] !== undefined) {
                element[param] = entry[param];
            }

            return element;
        }, {});
        result.push(newEntry);

        return result;
    }, []);

exports.select = (...params) => ({
    priority: OPERATION_PRIORITY.indexOf('select'),
    func: collection => select(collection, params)
});

const filterIn = (collection, property, values) => collection
    .filter(entry => values.includes(entry[property]));

exports.filterIn = (property, values) => ({
    priority: OPERATION_PRIORITY.indexOf('filterIn'),
    func: collection => filterIn(collection, property, values)
});

const sortBy = (collection, property, order) => {
    const copy = copyCollection(collection);
    if (order === 'asc') {
        return copy.sort((a, b) => a[property] > b[property]);
    }

    return copy.sort((a, b) => a[property] < b[property]);
};

exports.sortBy = (property, order) => ({
    priority: OPERATION_PRIORITY.indexOf('sortBy'),
    func: collection => sortBy(collection, property, order)
});

const format = (collection, property, formatter) =>
    collection.map(entry => {
        if (entry[property] !== undefined) {
            entry[property] = formatter(entry[property]);
        }

        return entry;
    });


exports.format = (property, formatter) => ({
    priority: OPERATION_PRIORITY.indexOf('format'),
    func: collection => format(collection, property, formatter)
});

const limit = (collection, count) => collection.slice(0, count);

exports.limit = count => ({
    priority: OPERATION_PRIORITY.indexOf('limit'),
    func: collection => limit(collection, count)
});

if (exports.isStar) {
    const or = (collection, params) =>
        collection.filter(entry =>
            params.some(param => param.func([entry]).length)
        );

    exports.or = (...params) => ({
        priority: OPERATION_PRIORITY.indexOf('or'),
        func: collection => or(collection, params)
    });

    const and = (collection, params) =>
        collection.filter(entry =>
            params.every(param => param.func([entry]).length)
        );

    exports.and = (...params) => ({
        priority: OPERATION_PRIORITY.indexOf('and'),
        func: collection => and(collection, params)
    });
}
