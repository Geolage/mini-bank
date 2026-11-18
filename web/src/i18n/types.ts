import enUS from './locales/en-US'

export type Locale = 'en-US' | 'zh-CN'
export type Messages = typeof enUS

type Leaf<T> = T extends string
  ? never
  : {
      [K in keyof T]-?: K extends string
        ? T[K] extends string
          ? K
          : `${K}.${Leaf<T[K]>}`
        : never
    }[keyof T]

export type MessageKey = Leaf<Messages>
