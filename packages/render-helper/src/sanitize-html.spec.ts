import { sanitizeHtml } from './methods/sanitize-html.method'

describe('sanitizeHtml', () => {
  describe('XSS prevention', () => {
    describe('event handlers', () => {
      it('should strip onclick handlers', () => {
        const input = '<div onclick="alert(1)">Click me</div>'
        const expected = '<div>Click me</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onerror handlers from images', () => {
        const input = '<img src="x" onerror="alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onload handlers', () => {
        const input = '<body onload="alert(1)">Content</body>'
        const expected = 'Content'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onmouseover handlers', () => {
        const input = '<a href="#" onmouseover="alert(1)">Hover</a>'
        const expected = '<a href="#">Hover</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onfocus handlers', () => {
        const input = '<input onfocus="alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onblur handlers', () => {
        const input = '<input onblur="alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onchange handlers', () => {
        const input = '<select onchange="alert(1)"><option>1</option></select>'
        const expected = '1'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onsubmit handlers', () => {
        const input = '<form onsubmit="alert(1)"><input type="submit"></form>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip oninput handlers', () => {
        const input = '<input type="text" oninput="alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onkeypress handlers', () => {
        const input = '<input onkeypress="alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onkeydown handlers', () => {
        const input = '<div onkeydown="alert(1)">Text</div>'
        const expected = '<div>Text</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onkeyup handlers', () => {
        const input = '<div onkeyup="alert(1)">Text</div>'
        const expected = '<div>Text</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip ondblclick handlers', () => {
        const input = '<div ondblclick="alert(1)">Double click</div>'
        const expected = '<div>Double click</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip oncontextmenu handlers', () => {
        const input = '<div oncontextmenu="alert(1)">Right click</div>'
        const expected = '<div>Right click</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onwheel handlers', () => {
        const input = '<div onwheel="alert(1)">Scroll</div>'
        const expected = '<div>Scroll</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip ondrag handlers', () => {
        const input = '<div ondrag="alert(1)">Drag me</div>'
        const expected = '<div>Drag me</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip ondrop handlers', () => {
        const input = '<div ondrop="alert(1)">Drop zone</div>'
        const expected = '<div>Drop zone</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip oncopy handlers', () => {
        const input = '<p oncopy="alert(1)">Copy this</p>'
        const expected = '<p>Copy this</p>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip oncut handlers', () => {
        const input = '<p oncut="alert(1)">Cut this</p>'
        const expected = '<p>Cut this</p>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip onpaste handlers', () => {
        const input = '<input onpaste="alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('javascript URLs', () => {
      it('should strip javascript: in href', () => {
        const input = '<a href="javascript:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip javascript: in img src', () => {
        const input = '<img src="javascript:alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip javascript: in video src', () => {
        const input = '<video src="javascript:alert(1)" controls></video>'
        const expected = '<video controls></video>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip javascript: with mixed case', () => {
        const input = '<a href="JaVaScRiPt:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip javascript: with whitespace', () => {
        const input = '<a href="java script:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip data: URLs in img src', () => {
        const input = '<img src="data:text/html,<script>alert(1)</script>">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip vbscript: URLs', () => {
        const input = '<a href="vbscript:msgbox(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow http URLs in href', () => {
        const input = '<a href="http://example.com">Link</a>'
        const expected = '<a href="http://example.com">Link</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow https URLs in href', () => {
        const input = '<a href="https://example.com">Link</a>'
        const expected = '<a href="https://example.com">Link</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow https URLs in img src', () => {
        const input = '<img src="https://example.com/image.jpg">'
        const expected = '<img src="https://example.com/image.jpg">'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('encoded attacks', () => {
      it('should prevent HTML entity encoded script tags', () => {
        const input = '&lt;script&gt;alert(1)&lt;/script&gt;'
        const expected = '&lt;script&gt;alert(1)&lt;/script&gt;'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent decimal entity encoded javascript', () => {
        const input = '<img src="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent hex entity encoded javascript', () => {
        const input = '<img src="&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3a;alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent URL encoded javascript', () => {
        const input = '<a href="%6a%61%76%61%73%63%72%69%70%74%3aalert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should handle entity encoded onclick', () => {
        const input = '<div &#111;&#110;&#99;&#108;&#105;&#99;&#107;="alert(1)">Click</div>'
        const expected = '<div>Click</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('attribute injection', () => {
      it('should prevent attribute injection in img tag', () => {
        const input = '<img src="x" onerror="alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent multiple dangerous attributes', () => {
        const input = '<img src="x" onerror="alert(1)" onclick="alert(2)" onload="alert(3)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent dynsrc attribute on img', () => {
        const input = '<img dynsrc="javascript:alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent lowsrc attribute on img', () => {
        const input = '<img lowsrc="javascript:alert(1)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent both dynsrc and lowsrc attributes', () => {
        const input = '<img src="x" dynsrc="javascript:alert(1)" lowsrc="javascript:alert(2)">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('CSS injection', () => {
      it('should strip style tags', () => {
        const input = '<style>body { background: red; }</style><p>Text</p>'
        const expected = '<p>Text</p>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip style tags with XSS', () => {
        const input = '<style>@import "javascript:alert(1)"</style>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should block inline style attributes', () => {
        const input = '<div style="background: red">Text</div>'
        const expected = '<div>Text</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should block style with expression()', () => {
        const input = '<div style="width: expression(alert(1))">Text</div>'
        const expected = '<div>Text</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should block style with -moz-binding', () => {
        const input = '<div style="-moz-binding: url(xss.xml#xss)">Text</div>'
        const expected = '<div>Text</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('script tag variations', () => {
      it('should strip script tags', () => {
        const input = '<script>alert(1)</script>'
        const expected = 'alert(1)'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip uppercase script tags', () => {
        const input = '<SCRIPT>alert(1)</SCRIPT>'
        const expected = 'alert(1)'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip mixed case script tags', () => {
        const input = '<ScRiPt>alert(1)</ScRiPt>'
        const expected = 'alert(1)'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip script tags with attributes', () => {
        const input = '<script type="text/javascript">alert(1)</script>'
        const expected = 'alert(1)'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip script tags with src', () => {
        const input = '<script src="https://evil.com/xss.js"></script>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip script tags nested in content', () => {
        const input = '<div>Safe content<script>alert(1)</script>More content</div>'
        const expected = '<div>Safe contentalert(1)More content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('image-based XSS', () => {
      it('should allow safe images', () => {
        const input = '<img src="https://example.com/image.jpg" alt="Safe">'
        const expected = '<img src="https://example.com/image.jpg" alt="Safe">'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip svg tags', () => {
        const input = '<svg onload="alert(1)"><circle r="50"/></svg>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip svg with script inside', () => {
        const input = '<svg><script>alert(1)</script></svg>'
        const expected = 'alert(1)'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip embed tags', () => {
        const input = '<embed src="javascript:alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip object tags', () => {
        const input = '<object data="javascript:alert(1)"></object>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip applet tags', () => {
        const input = '<applet code="XSS.class"></applet>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('form-based XSS', () => {
      it('should strip form tags', () => {
        const input = '<form action="https://evil.com"><input name="data"></form>'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip input tags', () => {
        const input = '<input type="text" value="test">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip textarea tags', () => {
        const input = '<textarea>Content</textarea>'
        const expected = 'Content'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip select tags', () => {
        const input = '<select><option>1</option></select>'
        const expected = '1'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip button tags', () => {
        const input = '<button onclick="alert(1)">Click</button>'
        const expected = 'Click'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('link-based XSS', () => {
      it('should strip dangerous link href', () => {
        const input = '<a href="javascript:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow safe links', () => {
        const input = '<a href="https://example.com">Safe link</a>'
        const expected = '<a href="https://example.com">Safe link</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow relative links', () => {
        const input = '<a href="/page">Internal</a>'
        const expected = '<a href="/page">Internal</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow anchor links', () => {
        const input = '<a href="#section">Jump</a>'
        const expected = '<a href="#section">Jump</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('meta and base tags', () => {
      it('should strip meta tags', () => {
        const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip base tags', () => {
        const input = '<base href="https://evil.com/">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip link tags', () => {
        const input = '<link rel="stylesheet" href="https://evil.com/xss.css">'
        const expected = ''
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('iframe injection', () => {
      it('should allow iframe with safe src', () => {
        const input = '<iframe src="https://youtube.com/embed/abc123"></iframe>'
        const expected = '<iframe src="https://youtube.com/embed/abc123"></iframe>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip javascript: in iframe src', () => {
        const input = '<iframe src="javascript:alert(1)"></iframe>'
        const expected = '<iframe src></iframe>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip data: URLs in iframe', () => {
        const input = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'
        const expected = '<iframe src></iframe>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('base64 encoded payloads', () => {
      it('should prevent base64 encoded javascript in data URLs', () => {
        const input = '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+">'
        const expected = '<img>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should prevent base64 in iframe', () => {
        const input = '<iframe src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></iframe>'
        const expected = '<iframe src></iframe>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('unicode and special encoding', () => {
      it('should handle null bytes in javascript URL', () => {
        const input = '<a href="java\x00script:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should handle unicode in attribute names', () => {
        const input = '<div \u{6F}nclick="alert(1)">Click</div>'
        const expected = '<div>Click</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should handle mixed encoding in javascript URL', () => {
        const input = '<a href="&#14;javascript:alert(1)">Click</a>'
        const expected = '<a href>Click</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('HTML entity encoding bypasses', () => {
      it('should not execute encoded script content', () => {
        const input = '&lt;img src=x onerror=alert(1)&gt;'
        const expected = '&lt;img src=x onerror=alert(1)&gt;'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should handle double encoding', () => {
        const input = '&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;'
        const expected = '&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('video tag security', () => {
      it('should strip dangerous video src', () => {
        const input = '<video src="javascript:alert(1)" controls></video>'
        const expected = '<video controls></video>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip dangerous poster attribute', () => {
        const input = '<video poster="javascript:alert(1)" controls></video>'
        const expected = '<video controls></video>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow safe video with http src', () => {
        const input = '<video src="http://example.com/video.mp4" controls></video>'
        const expected = '<video src="http://example.com/video.mp4" controls></video>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip non-http/https video src', () => {
        const input = '<video src="ftp://example.com/video.mp4" controls></video>'
        const expected = '<video controls></video>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })
  })

  describe('allowed content', () => {
    it('should allow valid video tags with https src and controls', () => {
      const input = '<video src="https://example.com/video.mp4" controls></video>'
      const expected = '<video src="https://example.com/video.mp4" controls></video>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow valid video tags with http src and controls', () => {
      const input = '<video src="http://example.com/video.mp4" controls></video>'
      const expected = '<video src="http://example.com/video.mp4" controls></video>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should strip audio tags (not in whitelist)', () => {
      const input = '<audio src="https://example.com/audio.mp3" controls></audio>'
      const expected = ''
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe iframe with allowed attributes', () => {
      const input = '<iframe src="https://youtube.com/embed/abc" frameborder="0" allowfullscreen></iframe>'
      const expected = '<iframe src="https://youtube.com/embed/abc" frameborder="0" allowfullscreen></iframe>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe images with alt text', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Description">'
      const expected = '<img src="https://example.com/image.jpg" alt="Description">'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe links with target attribute', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>'
      const expected = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe HTML formatting', () => {
      const input = '<p><strong>Bold</strong> <em>italic</em> <code>code</code></p>'
      const expected = '<p><strong>Bold</strong> <em>italic</em> <code>code</code></p>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const expected = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow safe tables', () => {
      const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>'
      const expected = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow blockquotes', () => {
      const input = '<blockquote>Quote</blockquote>'
      const expected = '<blockquote>Quote</blockquote>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow headings with dir attribute', () => {
      const input = '<h1 dir="ltr">Heading</h1>'
      const expected = '<h1 dir="ltr">Heading</h1>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should allow code blocks', () => {
      const input = '<pre><code>const x = 1;</code></pre>'
      const expected = '<pre><code>const x = 1;</code></pre>'
      expect(sanitizeHtml(input)).toBe(expected)
    })
  })

  describe('attribute validation', () => {
    describe('ID whitelist', () => {
      it('should allow valid IDs starting with letter', () => {
        const input = '<div id="myDiv">Content</div>'
        const expected = '<div id="myDiv">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow IDs with letters, numbers, hyphens, underscores', () => {
        const input = '<div id="my-div_123">Content</div>'
        const expected = '<div id="my-div_123">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip IDs starting with number', () => {
        const input = '<div id="123invalid">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip IDs starting with hyphen', () => {
        const input = '<div id="-invalid">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip IDs starting with underscore', () => {
        const input = '<div id="_invalid">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip IDs with special characters', () => {
        const input = '<div id="my@div">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip IDs with spaces', () => {
        const input = '<div id="my div">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip empty IDs', () => {
        const input = '<div id="">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should handle entity-encoded IDs', () => {
        const input = '<div id="&#118;&#97;&#108;&#105;&#100;">Content</div>'
        const expected = '<div id="valid">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip entity-encoded invalid IDs', () => {
        const input = '<div id="&#49;&#105;&#110;&#118;&#97;&#108;&#105;&#100;">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('class filtering', () => {
      it('should allow valid classes', () => {
        const input = '<div class="container">Content</div>'
        const expected = '<div class="container">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow multiple classes', () => {
        const input = '<div class="container fluid">Content</div>'
        const expected = '<div class="container fluid">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip forbidden "wr" class from span', () => {
        const input = '<span class="wr">Content</span>'
        const expected = '<span>Content</span>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip "wr" class with different case from span', () => {
        const input = '<span class="WR">Content</span>'
        const expected = '<span>Content</span>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip "wr" class with whitespace from span', () => {
        const input = '<span class=" wr ">Content</span>'
        const expected = '<span>Content</span>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow "wr" class on non-span elements', () => {
        const input = '<div class="wr">Content</div>'
        const expected = '<div class="wr">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow classes on images', () => {
        const input = '<img src="https://example.com/image.jpg" class="responsive">'
        const expected = '<img src="https://example.com/image.jpg" class="responsive">'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow classes on links', () => {
        const input = '<a href="https://example.com" class="btn">Link</a>'
        const expected = '<a href="https://example.com" class="btn">Link</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })

    describe('data attributes', () => {
      it('should allow whitelisted data attributes on links', () => {
        const input = '<a href="#" data-permlink="post" data-author="user">Link</a>'
        const expected = '<a href="#" data-permlink="post" data-author="user">Link</a>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should allow data-align on divs', () => {
        const input = '<div data-align="center">Content</div>'
        const expected = '<div data-align="center">Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })

      it('should strip non-whitelisted data attributes', () => {
        const input = '<div data-evil="xss">Content</div>'
        const expected = '<div>Content</div>'
        expect(sanitizeHtml(input)).toBe(expected)
      })
    })
  })

  describe('tag filtering', () => {
    it('should strip script tags completely', () => {
      const input = '<p>Before</p><script>alert(1)</script><p>After</p>'
      const expected = '<p>Before</p>alert(1)<p>After</p>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should strip style tag body', () => {
      const input = '<p>Before</p><style>body { color: red; }</style><p>After</p>'
      const expected = '<p>Before</p><p>After</p>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should strip unknown tags', () => {
      const input = '<custom-element>Content</custom-element>'
      const expected = 'Content'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should preserve allowed nested tags', () => {
      const input = '<div><p><strong><em>Nested</em></strong></p></div>'
      const expected = '<div><p><strong><em>Nested</em></strong></p></div>'
      expect(sanitizeHtml(input)).toBe(expected)
    })

    it('should handle malformed HTML gracefully', () => {
      const input = '<div><p>Unclosed paragraph<div>Nested</div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('onclick')
    })
  })
})
