import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'
import http from 'highlight.js/lib/languages/http'
import c from 'highlight.js/lib/languages/c'

hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('http', http)
hljs.registerLanguage('c', c)
hljs.registerAliases(['py'], { languageName: 'python' })
hljs.registerAliases(['sh', 'shell', 'console'], { languageName: 'bash' })

export { hljs }
