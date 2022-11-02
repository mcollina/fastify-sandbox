export default async function (app) {
  app.get('/', async () => {
    return { check: true }
  })
}
