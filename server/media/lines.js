// the lines of a text stream (a tool's stdout), as they arrive
export async function* lines(stream) {
  const decoder = new TextDecoder();
  let rest = '';

  for await (const chunk of stream) {
    rest += decoder.decode(chunk, { stream: true });

    const parts = rest.split('\n');

    rest = parts.pop();
    yield* parts;
  }

  if(rest.trim()) yield rest;
}
