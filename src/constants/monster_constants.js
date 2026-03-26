import PropTypes from 'prop-types'

export const LINK = {
  type: PropTypes.string,
  name: PropTypes.string,
  alt: PropTypes.string,
  href: PropTypes.string,
  note: PropTypes.string,
  'game-obj': PropTypes.string,
  aonid: PropTypes.number,
}

export const IMAGE = {
  type: PropTypes.string,
  'game-obj': PropTypes.string,
  name: PropTypes.string,
  image: PropTypes.string,
}

export const MODIFIER = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
}

export const ACTION = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  attack_type: PropTypes.string,
  image: PropTypes.shape(IMAGE),
}

export const TRAIT = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  class: PropTypes.string,
  text: PropTypes.string,
  link: PropTypes.shape(LINK),
}

export const TRAITS = PropTypes.arrayOf(PropTypes.shape(TRAIT))

export const RANGE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  range: PropTypes.number,
  text: PropTypes.string,
  unit: PropTypes.string,
}

export const ABILITY = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  ability_type: PropTypes.string,
  value: PropTypes.number,
  text: PropTypes.string,
  trigger: PropTypes.string,
  effect: PropTypes.string,
  frequency: PropTypes.string,
  requirement: PropTypes.string,
  prerequisite: PropTypes.string,
  range: PropTypes.string,
  failure: PropTypes.string,
  success: PropTypes.string,
  critical_failure: PropTypes.string,
  critical_success: PropTypes.string,
  action: PropTypes.shape(ACTION),
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
  traits: PropTypes.arrayOf(PropTypes.shape(TRAIT)),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const AC = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const AFFLICTION = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  text: PropTypes.string,
  action: PropTypes.shape(ACTION),
  traits: PropTypes.arrayOf(PropTypes.shape(TRAIT)),
  saving_throw: PropTypes.string,
  onset: PropTypes.string,
  maximum_duration: PropTypes.string,
  stages: PropTypes.arrayOf(PropTypes.string),
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
}

export const ATTACK_BONUS = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  link: PropTypes.shape(LINK),
  bonuses: PropTypes.arrayOf(PropTypes.number),
}

export const ATTACK_DAMAGE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  formula: PropTypes.string,
  damage_type: PropTypes.string,
  effect: PropTypes.string,
  notes: PropTypes.string,
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
  persistent: PropTypes.bool,
  splash: PropTypes.bool,
}

export const ATTACK = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  action: PropTypes.shape(ACTION),
  traits: PropTypes.arrayOf(PropTypes.shape(TRAIT)),
  weapon: PropTypes.string,
  bonus: PropTypes.shape(ATTACK_BONUS),
  damage: PropTypes.arrayOf(PropTypes.shape(ATTACK_DAMAGE)),
}

export const SAVE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const SAVES = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  fort: PropTypes.shape(SAVE),
  ref: PropTypes.shape(SAVE),
  will: PropTypes.shape(SAVE),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const HP = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  automatic_abilities: PropTypes.arrayOf(PropTypes.shape(ABILITY)),
}

export const HARDNESS = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
}

export const PROTECTION = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
  link: PropTypes.shape(LINK),
}

export const PROTECTIONS = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  immunities: PropTypes.arrayOf(PropTypes.shape(PROTECTION)),
  resistances: PropTypes.arrayOf(PropTypes.shape(PROTECTION)),
  weaknesses: PropTypes.arrayOf(PropTypes.shape(PROTECTION)),
}

export const DEFENSE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  ac: PropTypes.shape(AC),
  saves: PropTypes.shape(SAVES),
  hp: PropTypes.shape(HP),
  hardness: PropTypes.shape(HARDNESS),
  immunities: PropTypes.shape(PROTECTIONS),
  resistances: PropTypes.shape(PROTECTIONS),
  weaknesses: PropTypes.shape(PROTECTIONS),
}

export const SPEED = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  movement_type: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const SPEEDS = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  movement: PropTypes.arrayOf(PropTypes.shape(SPEED)),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const SPELL = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  count: PropTypes.number,
  count_text: PropTypes.string,
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
}

export const SPELL_LIST = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  level: PropTypes.number,
  level_text: PropTypes.string,
  spells: PropTypes.arrayOf(PropTypes.shape(SPELL)),
  constant: PropTypes.bool,
  cantrips: PropTypes.bool,
}

export const SPELLS = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  text: PropTypes.string,
  spell_tradition: PropTypes.string,
  spell_dc: PropTypes.number,
  focus_points: PropTypes.number,
  spell_attack: PropTypes.number,
  spell_lists: PropTypes.arrayOf(PropTypes.shape(SPELL_LIST)),
  notes: PropTypes.arrayOf(PropTypes.string),
}

export const OFFENSIVE_ACTION = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  offensive_action_type: PropTypes.string,
  attack: PropTypes.shape(ATTACK),
  spells: PropTypes.shape(SPELLS),
  affliction: PropTypes.shape(AFFLICTION),
  ability: PropTypes.shape(ABILITY),
}

export const OFFENSE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  speeds: PropTypes.shape(SPEEDS),
  offensive_actions: PropTypes.arrayOf(PropTypes.shape(OFFENSIVE_ACTION)),
}

export const PERCEPTION = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const SPECIAL_SENSE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  range: PropTypes.shape(RANGE),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
  link: PropTypes.shape(LINK),
}

export const SENSES = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  link: PropTypes.shape(LINK),
  perception: PropTypes.shape(PERCEPTION),
  special_senses: PropTypes.arrayOf(PropTypes.shape(SPECIAL_SENSE)),
}

export const INLINE_ABILITY = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  ability_type: PropTypes.string,
  links: PropTypes.arrayOf(PropTypes.shape(LINK)),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const LANGUAGE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  link: PropTypes.shape(LINK),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const LANGUAGES = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  languages: PropTypes.arrayOf(PropTypes.shape(LANGUAGE)),
  communication_abilities: PropTypes.arrayOf(INLINE_ABILITY),
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
}

export const KNOWLEDGE_SKILL = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  link: PropTypes.shape(LINK),
}

export const KNOWLEDGE = {
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  dc: PropTypes.number,
  skills: PropTypes.arrayOf(PropTypes.shape(KNOWLEDGE_SKILL)),
  link: PropTypes.shape(LINK),
}

export const KNOWLEDGES = PropTypes.arrayOf(PropTypes.shape(KNOWLEDGE))

export const SKILLS = PropTypes.arrayOf(PropTypes.shape({
  type: PropTypes.string,
  subtype: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  modifiers: PropTypes.arrayOf(PropTypes.shape(MODIFIER)),
  link: PropTypes.shape(LINK),
}))
