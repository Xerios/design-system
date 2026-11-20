<script>
  /** Kitchen sink: long-form text in .prose, every element it styles, and the heading that links to itself. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import AnchorHeading from '@xerios/design-system/components/AnchorHeading.svelte'

  const CODE = `// Group the entries by version, newest first.
export function byVersion(entries) {
  const groups = Map.groupBy(entries, (e) => e.version)
  return [...groups].sort(([a], [b]) => compare(b, a))
}`
</script>

<Section
  id="typography"
  title="Typography"
  intro="Long-form text (docs, notes, rendered markdown) takes the .prose class: it styles the plain elements inside it."
>
  <Demo label="Anchored heading">
    <Case label="Hover a heading, or Tab to its link">
      <div class="prose full">
        <AnchorHeading id="ks-anchor-install" level={2}>Install</AnchorHeading>
        <p>The link after a heading puts its address in the location bar, to share that part of the page.</p>
        <AnchorHeading id="ks-anchor-configure" level={3}>Configure the build</AnchorHeading>
        <AnchorHeading id="ks-anchor-variables" level={4}>Variables, in a heading long enough to wrap onto a second line</AnchorHeading>
      </div>
    </Case>
  </Demo>
  <Demo label="Headings">
    <div class="prose full specimen">
      <h1>Heading 1, 26px</h1>
      <h2>Heading 2, 20px</h2>
      <h3>Heading 3, 17px</h3>
      <h4>Heading 4, 15px</h4>
      <h5>Heading 5, 14px</h5>
      <h6>Heading 6, 14px and muted</h6>
    </div>
  </Demo>
  <Demo label="Running text and inline elements">
    <div class="prose full">
      <p>
        Body text is 15px on a 24px line, with room between the lines for reading. It holds <a href="#typography">links</a>,
        <strong>strong</strong> and <em>emphasised</em> words, <code>inline code</code>, keys such as <kbd>⌘</kbd>
        <kbd>K</kbd>, <mark>highlighted text</mark>, an <abbr title="Application programming interface">API</abbr> with its expansion on hover,
        <small>small print</small>, <del>removed</del> and <ins>inserted</ins> words,
        <s>no longer true</s>, H<sub>2</sub>O and 2<sup>10</sup>.
      </p>
      <p>A second paragraph starts 20px below the first. Lines never end in a lone word where the browser can avoid it.</p>
    </div>
  </Demo>
  <Demo label="Lists">
    <div class="prose full">
      <ul>
        <li>An unordered list</li>
        <li>
          With a list inside it
          <ul>
            <li>Hollow markers one level down</li>
            <li>Closer together than paragraphs</li>
          </ul>
        </li>
        <li>And a last item</li>
      </ul>
      <ol>
        <li>An ordered list</li>
        <li>
          With steps inside a step
          <ol>
            <li>Lettered one level down</li>
            <li>Numbers in the data face</li>
          </ol>
        </li>
        <li>And a third step</li>
      </ol>
      <dl>
        <dt>A term</dt>
        <dd>Its description, set in under it.</dd>
        <dt>Another term</dt>
        <dd>And what it means.</dd>
      </dl>
    </div>
  </Demo>
  <Demo label="Quote, code block and rule">
    <div class="prose full">
      <blockquote>
        <p>Make it work, make it right, make it fast.</p>
        <cite>Kent Beck</cite>
      </blockquote>
      <hr />
      <pre><code>{CODE}</code></pre>
    </div>
  </Demo>
  <Demo label="Table in a figure">
    <figure class="prose full">
      <table>
        <thead>
          <tr><th scope="col">Region</th><th scope="col">Median</th><th scope="col">Slowest</th></tr>
        </thead>
        <tbody>
          <tr><td>Frankfurt</td><td>12 ms</td><td>48 ms</td></tr>
          <tr><td>Virginia</td><td>86 ms</td><td>210 ms</td></tr>
          <tr><td>Singapore</td><td>184 ms</td><td>402 ms</td></tr>
        </tbody>
      </table>
      <figcaption>Response times over the past week.</figcaption>
    </figure>
  </Demo>
  <Demo label="All of it together, as a page reads" wide>
    <article class="prose page">
      <AnchorHeading id="ks-prose-changelog" level={1}>Keep a changelog</AnchorHeading>
      <p>
        A changelog tells people what changed between two versions, in words rather than commits. Write it for the person updating, not for the person who made
        the change.
      </p>
      <AnchorHeading id="ks-prose-entry" level={2}>What goes in an entry</AnchorHeading>
      <p>Group the changes under the version they shipped in, newest first, and sort each version's changes by kind:</p>
      <ul>
        <li><strong>Added</strong> for new features.</li>
        <li><strong>Changed</strong> for changes to what already worked.</li>
        <li><strong>Fixed</strong> for bugs, with the symptom rather than the cause.</li>
      </ul>
      <AnchorHeading id="ks-prose-order" level={3}>Putting them in order</AnchorHeading>
      <ol>
        <li>Read the version from each entry's heading.</li>
        <li>Sort the versions, newest first, with <code>compare</code>.</li>
        <li>Press <kbd>⌘</kbd> <kbd>S</kbd> and read it once more before publishing.</li>
      </ol>
      <pre><code>{CODE}</code></pre>
      <blockquote>
        <p>If a change needs people to do something, say what, in the first line of its entry.</p>
      </blockquote>
      <hr />
      <p><small>Last edited on <time datetime="2026-11-18">18 November 2026</time>.</small></p>
    </article>
  </Demo>
</Section>

<style>
  .full {
    width: 100%;
    min-width: 0;
    margin: 0;
  }
  /* The headings as a list to compare, not as they space themselves in running text (the last demo shows that). */
  .specimen > * + * {
    margin-top: var(--space-3);
  }
  .page {
    max-width: 68ch;
  }
</style>
