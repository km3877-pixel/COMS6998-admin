"use client";
export default function ErrorPage({ reset }) {
  return <main className="message-layout"><section className="message-card">
    <h1>Something didn’t load.</h1><p>Please try again.</p><button onClick={reset}>Try again</button>
  </section></main>;
}
