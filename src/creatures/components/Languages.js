import React from 'react'
import Language from './Language'
import Modifiers from './Modifiers'
import InlineAbility from './InlineAbility'
import Changed from '../../shared/Changed'
import { comma } from '../../shared/utils'

const Languages = (props) => {
  const { languages } = props

  if (!languages) { return null }

  let langs = languages.languages
  let abilities = languages.communication_abilities

  return (
    <div className='Monster__languages'>
      <strong className="Monster__heading">Languages </strong>
      {langs ? langs.map((l, i) =>
        <Changed path={`/stat_block/statistics/languages/languages/${i}`} key={i}>
          <Language language={l} i={i}>{comma(i, langs)}</Language>
        </Changed>
      ) : null}{comma(-1, abilities, "; ")}
      {abilities ? abilities.map((c, i) => {
        return (
          <InlineAbility ability={c} key={i}>{comma(i, abilities)}</InlineAbility>
        )
      }) : null}<Modifiers modifiers={languages.modifiers} semicolon={true} />
    </div>
  )
}

export default Languages
