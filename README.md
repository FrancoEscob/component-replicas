# component-replicas

Colección de componentes de UI recreados desde cero a partir de referencias que nos gustan, pensados para **usarse de verdad**: cada uno es una librería autocontenida, con API documentada, tipos, temas y todo configurable.

## Componentes

| Componente | Referencia | Stack | Demo |
|---|---|---|---|
| [Trace Waterfall](./components/trace-waterfall) | [kobra.systems](https://kobra.systems/components/trace-waterfall) | JS puro + React · TS | [playground](https://francoescob.github.io/component-replicas/components/trace-waterfall/) · [live](https://francoescob.github.io/component-replicas/components/trace-waterfall/examples/live.html) |

## Usar un componente

```bash
# copiarlo a tu proyecto (el código queda tuyo, estilo shadcn)
npx degit FrancoEscob/component-replicas/components/<nombre> src/components/<nombre>

# o como dependencia (pnpm)
pnpm add "github:FrancoEscob/component-replicas#path:/components/<nombre>"
```

Cada componente documenta en su README otras opciones (CDN, bundle global).

## Sumar un componente

Una carpeta por componente en `components/<nombre-en-kebab-case>/`, con esta estructura:

```
components/<nombre>/
  README.md          instalación, uso, formato de datos, API, personalización, créditos
  element.md         desglose del original: tokens, medidas, timings, easings, comportamiento
  package.json       nombre @component-replicas/<nombre>, "exports", "types"
  src/               el componente (+ index.d.ts con los tipos)
  react/             wrapper de React, si el núcleo no es React
  dist/              bundles listos para CDN / <script> (commiteados)
  index.html         playground con todas las opciones editables
  standalone.html    demo que abre con doble clic
  examples/          casos reales (datos en vivo, frameworks)
  shots/             capturas
```

Criterios para considerarlo terminado:

1. **Fidelidad.** Medir el original (DOM, estilos computados, timings) y documentarlo en `element.md` con el nivel de confianza de cada dato.
2. **Usable en un proyecto real.** Datos de entrada flexibles (mapeo o adaptadores), API imperativa, eventos y tipos.
3. **Todo configurable.** Opciones con defaults, variables CSS para cada token visual y motion, textos traducibles.
4. **Responsive y accesible.** Container queries, teclado, `prefers-reduced-motion`, modo claro y oscuro.
5. **Código propio.** Recreado desde el comportamiento observable, nunca copiando código de pago. Dar crédito al autor original en el README.

## Licencia

[MIT](./LICENSE) para el código de este repo. Los diseños originales pertenecen a sus autores (ver los créditos en cada componente).
