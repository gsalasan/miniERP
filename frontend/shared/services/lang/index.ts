import EN from './EN'

type Meta = {
  app?: string | null
  schema?: string | null
  name?: string | null
}

export const Lang = {
  ...EN,
  module(meta: Meta | null, column: string): string {
    try {
      let translate: string | null = null
      if (meta) {
        const { app, schema, name } = meta

        interface MyObject {
          [key: string]: any
        }
        let obj: MyObject | undefined

        if (app && schema && name) {
          if (app == 'main') obj = this.main

          if (obj) {
            translate = obj?.[schema]?.[name]?.[column]
          }
        }
      }

      // If translation is not found, replace underscores with spaces
      if (!translate) {
        translate = column.replaceAll(/_/g, ' ')
      }

      return translate
    } catch (error) {
      // In case of any error, fall back to replacing underscores with spaces
      return column.replaceAll(/_/g, ' ')
    }
  }
}
