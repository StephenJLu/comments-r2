# Using Cloudflare R2 Object Storage to Serve a Comments Field
- 📖 [Full Documentation](https://docs.stephenjlu.com/docs-stephenjlu/projects/using-cloudflare-r2-object-storage-to-serve-a-comments-field)
- ⚡ [Live Test Demo](https://comments.stephenjlu.com/)
- 📝 [Blog Post](https://ledger.stephenjlu.com/how-i-made-a-comments-field-with-cloudflare-r2-object-storage)


## Development

Run the dev server:

```sh
npm run dev
```

To run Wrangler:

```sh
npm run build
npm run start
```

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
