module.exports = function (api) {
    api.cache(true);

    const presets = [
        [
            '@babel/env', {
            'targets': {
                'ie': '11'
            },
            'useBuiltIns': 'usage',
            'corejs': '3',
            'shippedProposals': true
        }]
    ];
    const plugins = [
        ['@babel/transform-runtime', { 'corejs': 3 }]
    ];
    if (process.env.NODE_ENV === 'production') {
        plugins.push(['transform-remove-console', { 'exclude': ['error', 'warn'] }]);
    }

    return {
        presets,
        plugins
    };
};