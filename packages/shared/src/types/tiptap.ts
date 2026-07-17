export interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

export interface TiptapDocument extends TiptapNode {
  type: 'doc'
  content: TiptapNode[]
}

export const emptyTiptapDocument: TiptapDocument = {
  type: 'doc',
  content: [],
}
