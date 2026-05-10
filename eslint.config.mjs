import { configs, plugins } from 'eslint-config-airbnb-extended'

const NATIVE_HTML_BANS = [
  { tag: 'div', use: '<Box> from @mui/material' },
  { tag: 'span', use: '<Typography component="span"> or <Box component="span">' },
  { tag: 'p', use: '<Typography>' },
  { tag: 'ul', use: '<List> from @mui/material' },
  { tag: 'ol', use: '<List> from @mui/material' },
  { tag: 'li', use: '<ListItem> from @mui/material' },
  { tag: 'button', use: '<Button> or <IconButton> from @mui/material' },
  { tag: 'input', use: '<TextField> / <Checkbox> / <Switch> / etc. from @mui/material' },
  { tag: 'select', use: '<Select> from @mui/material' },
]

const noRestrictedSyntax = [
  'error',
  ...NATIVE_HTML_BANS.map(({ tag, use }) => ({
    selector: `JSXOpeningElement[name.name='${tag}']`,
    message: `Use ${use} instead of <${tag}>. See feedback_prefer_mui.md.`,
  })),
  {
    selector: "JSXOpeningElement[name.name=/^h[1-6]$/]",
    message: 'Use <Typography component="h*" variant="..."> instead of native heading.',
  },
]

export default [
  plugins.stylistic,
  plugins.importX,
  plugins.node,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  plugins.next,
  plugins.typescriptEslint,
  ...configs.base.all,
  ...configs.react.all,
  ...configs.next.all,
  {
    rules: {
      'no-restricted-syntax': noRestrictedSyntax,

      // Project conventions: no semicolons, single quotes — disable conflicting Airbnb stylistic rules
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none', requireLast: false },
          singleline: { delimiter: 'semi', requireLast: false },
        },
      ],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/implicit-arrow-linebreak': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/no-confusing-arrow': 'off',
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/jsx-indent': 'off',
      '@stylistic/jsx-indent-props': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',

      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/jsx-one-expression-per-line': 'off',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/no-array-index-key': 'off',
      'react/jsx-no-bind': 'off',
      'react/destructuring-assignment': 'off',
      'import-x/prefer-default-export': 'off',
      'import-x/extensions': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/order': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
      '@typescript-eslint/lines-between-class-members': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'no-void': ['error', { allowAsStatement: true }],
      'no-underscore-dangle': 'off',
      'no-plusplus': 'off',
      'no-continue': 'off',
      'no-await-in-loop': 'off',
      'no-bitwise': 'off',
      'consistent-return': 'off',
      'class-methods-use-this': 'off',
      '@stylistic/max-len': 'off',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      ],
    },
  },
  {
    files: ['**/meta-ads/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
  },
]
