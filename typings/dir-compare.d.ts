declare module 'dir-compare' {
  export type DiffResult = {
    diffSet: Array<{ type1: string, type2: string, path1: string, path2: string, name1: string, name2: string }>
  }
  export function compare(src: string, target: string): Promise<DiffResult>
}
