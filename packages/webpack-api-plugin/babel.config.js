module.exports = {
    presets: [
        require('@babel/preset-env')
    ],
    plugins: [
        [require('@babel/plugin-transform-runtime'), {
            proposals: true
        }],
        require('@babel/plugin-proposal-function-bind'),
        require('@babel/plugin-proposal-class-properties')
    ]
};