import { For, Show, type Component, type JSX } from "solid-js"

export interface Column<T> {
  key: string
  header: string
  width?: string
  render?: (row: T) => JSX.Element
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  selectedId?: string | null
  getRowId?: (row: T) => string
  emptyMessage?: string
  emptyAction?: JSX.Element
}

function DataTable<T>(props: DataTableProps<T>): JSX.Element {
  return (
    <div class="w-full overflow-x-auto">
      <Show
        when={props.data.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center gap-4 py-16">
            <span class="font-mono text-sm text-text-tertiary">
              {props.emptyMessage ?? "Документов пока нет."}
            </span>
            {props.emptyAction}
          </div>
        }
      >
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bg-surface">
              <For each={props.columns}>
                {(col) => (
                  <th
                    class="px-4 py-2 text-left font-mono text-xs font-medium text-text-secondary uppercase tracking-[0.04em]"
                    style={col.width ? { width: col.width } : {}}
                  >
                    {col.header}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.data}>
              {(row) => {
                const id = () => props.getRowId?.(row) ?? ""
                const isSelected = () => props.selectedId === id()
                return (
                  <tr
                    onClick={() => props.onRowClick?.(row)}
                    class={`
                      border-b border-border-subtle cursor-pointer
                      transition-colors duration-[80ms]
                      hover:bg-interactive-hover
                      ${isSelected() ? "border-l-2 border-l-accent bg-interactive-hover" : ""}
                    `}
                  >
                    <For each={props.columns}>
                      {(col) => (
                        <td class="px-4 py-2 font-mono text-sm text-text-primary">
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? "")}
                        </td>
                      )}
                    </For>
                  </tr>
                )
              }}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  )
}

export default DataTable
