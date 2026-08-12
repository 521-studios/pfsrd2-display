import React from 'react'
import PropTypes from 'prop-types'

// TemplatePicker is the presentational control for applying/stacking templates:
// a dropdown to add one, plus tags for the applied stack (remove-last / clear-all).
// Pure UI — the consumer owns the data: pass the `templates` list (from
// listTemplates) and the current `stack`, and wire onApply (which calls
// applyTemplate), onRemoveLast, and onClearAll. Interactive per-template
// SELECTIONS (SelectionsPanel) are intentionally out of scope here — elite/weak
// and no-selection templates first (see the v2 design's open decision 2).
export default function TemplatePicker({
  templates = [],
  stack = [],
  onApply,
  onRemoveLast,
  onClearAll,
  loading = false,
  label = 'Templates:',
}) {
  return (
    <div className="TemplatePicker">
      <div className="TemplatePicker__row">
        <strong className="TemplatePicker__label">{label}</strong>
        <select
          className="TemplatePicker__select"
          data-testid="template-select"
          disabled={loading}
          defaultValue=""
          onChange={(e) => {
            const t = templates.find((t) => t.game_id === e.target.value)
            if (t) onApply(t)
            e.target.value = '' // reset so the same template can be applied again (stacking)
          }}
        >
          <option value="" disabled>
            {loading ? 'Applying…' : '+ Add template'}
          </option>
          {templates.map((t) => (
            <option key={t.game_id} value={t.game_id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {stack.length > 0 && (
        <div className="TemplatePicker__stack">
          {stack.map((entry, i) => (
            <span key={i} className="TemplatePicker__tag" data-testid="template-tag">
              {entry.template.name}
              {i === stack.length - 1 && (
                <span
                  className="TemplatePicker__remove"
                  data-testid="template-remove"
                  onClick={onRemoveLast}
                >
                  {' '}
                  ×
                </span>
              )}
            </span>
          ))}
          {stack.length > 1 && (
            <span className="TemplatePicker__clear" onClick={onClearAll}>
              Clear all
            </span>
          )}
        </div>
      )}
    </div>
  )
}

TemplatePicker.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({ game_id: PropTypes.string, name: PropTypes.string }),
  ),
  // stack entries carry at least { template: { name } } (the applied provenance).
  stack: PropTypes.arrayOf(
    PropTypes.shape({ template: PropTypes.shape({ name: PropTypes.string }) }),
  ),
  onApply: PropTypes.func.isRequired,
  onRemoveLast: PropTypes.func,
  onClearAll: PropTypes.func,
  loading: PropTypes.bool,
  label: PropTypes.string,
}
