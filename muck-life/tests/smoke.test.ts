import { describe, expect, it } from 'vitest';
import { campaignLevel, CAMPAIGN_LENGTH } from '../src/levels/campaign';
import { autoplay } from './bot';

describe('campaign', () => {
  it('every level is completable by a slow autoplayer', () => {
    for (let i = 0; i < CAMPAIGN_LENGTH; i++) {
      const s = autoplay(campaignLevel(i), { reactionSec: 2.5 });
      expect(s.objectivesMet(), campaignLevel(i).id).toBe(true);
    }
  });
});
