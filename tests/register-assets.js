// Node tests use the same game modules as Vite. Only image imports are stubbed.
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.match(/\.(png|webp)$/)) return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.match(/\.(png|webp)$/)) return { format: 'module', source: `export default ${JSON.stringify(url)};`, shortCircuit: true };
    return nextLoad(url, context);
  },
});
