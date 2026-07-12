/** Bir schema.org nesnesini <script type="application/ld+json"> olarak gömer. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Statik JSON, kullanıcı girdisi değil; </script> kaçışı XSS'i önler.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
