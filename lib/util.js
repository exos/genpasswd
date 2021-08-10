
module.exports.pick = (obj, keys) => Object.fromEntries(
    Object.entries(obj)
        .filter(([key]) => keys.includes(key))
);
