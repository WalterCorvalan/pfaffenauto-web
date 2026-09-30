// PostgREST corta cualquier select en 1000 filas (db.max_rows) sin importar
// qué .limit() se pida -- con la base real ya arriba de los 1000 clientes,
// cualquier fetch simple de una tabla grande pierde todo lo que caiga
// después del corte, sin avisar. Pagina con .range() hasta agotar la tabla.
//
// `build` arma la query desde cero (select/eq/order, sin range) -- se llama
// de nuevo en cada vuelta porque un query builder de supabase-js no se
// puede reusar entre awaits.
export async function fetchPaginado<T = any>(build: () => any): Promise<T[]> {
  const PAGINA = 1000;
  let desde = 0;
  let todos: T[] = [];
  while (true) {
    const { data, error } = await build().range(desde, desde + PAGINA - 1);
    if (error || !data) break;
    todos = todos.concat(data as T[]);
    if (data.length < PAGINA) break;
    desde += PAGINA;
  }
  return todos;
}
