# Publish @silinex/sdk

Package is ready under `sdk/typescript` (`0.1.0`, `publishConfig.access=public`).

```bash
cd sdk/typescript
npm login --registry https://registry.npmjs.org/
npm publish --access public --registry https://registry.npmjs.org/
```

This host defaults to a Tencent npm mirror — always pass the official registry for publish.

Verify:

```bash
npm view @silinex/sdk version --registry https://registry.npmjs.org/
npm install @silinex/sdk
```
