import React from 'react'
import MarkdownIt from 'markdown-it'

function markdown(text) {
  let configured_md = MarkdownIt({ breaks: true }).use(actions_plugin)
  if (text) {
    return configured_md.render(text)
  }
}

function markdown_inline(text) {
  if (text) {
    let configured_md = MarkdownIt({ breaks: true }).use(actions_plugin)

    const defaultSoftBreak = configured_md.renderer.rules.hardbreak
    configured_md.renderer.rules.paragraph_open = function (
      tokens,
      idx,
      options,
      env,
      self
    ) {
      return ''
    }
    configured_md.renderer.rules.paragraph_close = defaultSoftBreak
    let space = ''
    if (text.startsWith(' ')) {
      space = ' '
    }
    let markdown_text = configured_md.render(text).trimEnd()
    if (markdown_text.endsWith('<br>')) {
      markdown_text = markdown_text.substring(0, markdown_text.length - 4)
    }
    markdown_text = space + markdown_text
    return markdown_text
  }
}

function pathfinder_actions(state, silent) {
  if (state.src.charAt(state.pos) !== '[') {
    return false
  }
  const actions = {
    '[#]': 'One Action',
    '[##]': 'Two Actions',
    '[###]': 'Three Actions',
    '[@]': 'Reaction',
    '[-]': 'Free Action',
  }
  var endPos = state.pos
  var tag = null
  var tag_data = '['
  while (!tag) {
    endPos += 1
    if (endPos > state.src.length) {
      return false
    }
    if (['#', '@', '-'].indexOf(state.src.charAt(endPos)) > -1) {
      tag_data = tag_data + state.src.charAt(endPos)
    } else if (state.src.charAt(endPos) === ']') {
      tag_data = tag_data + state.src.charAt(endPos)
      tag = actions[tag_data]
    } else {
      return false
    }
  }
  var token = state.push('action', 'img', 0)
  token.attrs = [
    ['src', get_action_image(tag)],
    ['alt', tag],
    ['height', 15],
  ]
  endPos++
  state.pos = endPos
}

function actions_plugin(md, scheme) {
  md.inline.ruler.after('entity', 'pathfinder_actions', pathfinder_actions)
}

function get_action_image(action_name) {
  let images = {
    'Free Action':
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBDcmVhdGVkIHdpdGggSW5rc2NhcGUgKGh0dHA6Ly93d3cuaW5rc2NhcGUub3JnLykgLS0+Cjxzdmcgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMy4yMjkgMTMuMjI5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPHBhdGggdHJhbnNmb3JtPSJyb3RhdGUoLTQ1KSIgZD0ibTQuNjc3MiA0LjY3NzItOS4zNTQ0LTJlLTcgLTJlLTcgOS4zNTQ0aDkuMzU0NHptLTAuOTM1NDQgMC45MzU0NC0xZS03IDcuNDgzNWgtNy40ODM1bDFlLTcgLTMuNzQxOCAzLjc0MTggMWUtNyA2LjUzMDZlLTggLTMuNzQxOHoiIGZpbGw9IiNmZmYiIHN0cm9rZS13aWR0aD0iMCIvPgo8L3N2Zz4K',
    Reaction:
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDUwIDUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGcgY2xhc3M9IiIgdHJhbnNmb3JtPSJtYXRyaXgoMCAuMTAyNDIgLS4xMDIxNCAwIDUxLjQ1NSAtMi4wOTMpIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNmZmYiPgogIDxwYXRoIGQ9Im0yMzcuMTMgMTguMjgzYy01MS43NDggMC05OS4xODMgMjcuNTgtMTM2LjA3IDczLjM5NSAxMS45NDYtNi45NyAyNC41MjYtMTEuOTAzIDM3LjUxLTE0Ljc2IDguOTUyLTEuOTcgMTguMDYyLTIuOTYgMjcuMjUtMyAyNy41NjItMC4xMjMgNTUuODI0IDguMjgzIDgyLjYzNiAyNC4zMTggNzAuODI4IDQyLjM2MiAxMzIuNTggMTM3LjQ1IDE1My43IDI3NS4xOGwtNDkuNDQgMTIuNjM3IDc0LjMzIDEwOS43NCA3NC4zMjctMTQ3LjczLTUxLjg0IDEzLjI1YzAuNTY0LTguNTM0IDAuOS0xNy4xNiAwLjktMjUuOTA1IDAtMTc1LjA5LTk1Ljg0Ny0zMTcuMTItMjEzLjMxLTMxNy4xMmgtMmUtM3ptLTcxLjE2NSA3NC4zMDVjLTcuOTI0IDAuMDQtMTUuNzM0IDAuOS0yMy4zNzUgMi41ODItMzAuNDcgNi43MDUtNTguNzg1IDI2LjQ4LTgxLjM1NiA2MS44OS0yMy4yMzggNTAuODItMzYuODM0IDExMi4yMi0zNi44MzQgMTc4LjM0IDAgMTUuOTgzIDEuMzUgMzEuMzc4IDIuODgzIDQ2LjczIDE0LjM4Ny0xMzUuMSA5Mi43MDItMjM4LjYyIDE4Ny4zNi0yMzguNjIgMzQuNzEzIDAgNjcuMTc3IDEzLjk3NiA5NS4wODMgMzguMzM0LTIxLjYwOC0yOS45NjgtNDUuOTE1LTUyLjY1LTcwLjg2My02Ny41Ny0yNC4zMzctMTQuNTU2LTQ5LjEzLTIxLjgxLTcyLjkwMi0yMS42ODh6IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iOCIvPgogPC9nPgo8L3N2Zz4K',
    'One Action':
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBDcmVhdGVkIHdpdGggSW5rc2NhcGUgKGh0dHA6Ly93d3cuaW5rc2NhcGUub3JnLykgLS0+Cjxzdmcgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMy4yMjkgMTMuMjI5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPHJlY3QgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1KSIgeD0iLTQuNjc3MiIgeT0iNC42NzcyIiB3aWR0aD0iOS4zNTQ0IiBoZWlnaHQ9IjkuMzU0NCIgZmlsbD0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwIi8+Cjwvc3ZnPgo=',
    'Two Actions':
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBDcmVhdGVkIHdpdGggSW5rc2NhcGUgKGh0dHA6Ly93d3cuaW5rc2NhcGUub3JnLykgLS0+Cjxzdmcgd2lkdGg9Ijc1IiBoZWlnaHQ9IjUwIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxOS44NDQgMTMuMjI5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGcgc3Ryb2tlLXdpZHRoPSIwIj4KICA8cmVjdCB0cmFuc2Zvcm09InJvdGF0ZSgtNDUpIiB4PSI0LjcyMDJlLTciIHk9IjkuMzU0NCIgd2lkdGg9IjkuMzU0NCIgaGVpZ2h0PSI5LjM1NDQiIGZpbGw9IiNjY2MiLz4KICA8cmVjdCB0cmFuc2Zvcm09InJvdGF0ZSgtNDUpIiB4PSItNC42NzcyIiB5PSI0LjY3NzIiIHdpZHRoPSI5LjM1NDQiIGhlaWdodD0iOS4zNTQ0IiBmaWxsPSIjZmZmIi8+CiA8L2c+Cjwvc3ZnPgo=',
    'Three Actions':
      'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCEtLSBDcmVhdGVkIHdpdGggSW5rc2NhcGUgKGh0dHA6Ly93d3cuaW5rc2NhcGUub3JnLykgLS0+Cjxzdmcgd2lkdGg9IjEwMCIgaGVpZ2h0PSI1MCIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMjYuNDU4IDEzLjIyOSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDxnIHN0cm9rZS13aWR0aD0iMCI+CiAgPHJlY3QgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1KSIgeD0iNC42NzcyIiB5PSIxNC4wMzIiIHdpZHRoPSI5LjM1NDQiIGhlaWdodD0iOS4zNTQ0IiBmaWxsPSIjYWFhIi8+CiAgPHJlY3QgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1KSIgeD0iNC43MjAyZS03IiB5PSI5LjM1NDQiIHdpZHRoPSI5LjM1NDQiIGhlaWdodD0iOS4zNTQ0IiBmaWxsPSIjY2NjIi8+CiAgPHJlY3QgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1KSIgeD0iLTQuNjc3MiIgeT0iNC42NzcyIiB3aWR0aD0iOS4zNTQ0IiBoZWlnaHQ9IjkuMzU0NCIgZmlsbD0iI2ZmZiIvPgogPC9nPgo8L3N2Zz4K',
  }
  return images[action_name]
}

const Markdown = (props) => {
  const { text } = props

  if (!text) {
    return null
  }

  return (
    <span
      className="Markdown"
      dangerouslySetInnerHTML={{ __html: markdown_inline(text) }}
    />
  )
}

export { markdown, markdown_inline }
export default Markdown
