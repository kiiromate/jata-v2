import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeMatch,
  extractSkills,
  FLAT_TAXONOMY,
  quickScore,
} from '../../index.ts';

describe('@jata/common root exports', () => {
  it('exposes deterministic scoring entry points from the package index', () => {
    assert.equal(typeof quickScore, 'function');
    assert.equal(typeof extractSkills, 'function');
    assert.equal(typeof computeMatch, 'function');
    assert.ok(FLAT_TAXONOMY.length >= 200);

    const output = quickScore({
      cvText: 'Built Python services and React dashboards.',
      jdText: 'Requires Python, React, and SQL experience.',
    });

    assert.equal(output.match.score, 67);
    assert.deepEqual(output.match.matchedSkills, ['python', 'react']);
    assert.deepEqual(output.match.missingSkills, ['sql']);
  });
});
