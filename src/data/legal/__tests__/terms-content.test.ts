import { describe, it, expect } from 'bun:test';
import { termsSections, termsFooterLinks, termsLastUpdated } from '../terms-content';
import { privacySections, privacyFooterLinks, privacyLastUpdated } from '../privacy-content';

describe('Legal Content Validation', () => {
  describe('Terms of Service', () => {
    it('has valid structure and required sections', () => {
      expect(termsSections).toHaveLength(19); // 12 main sections + 7 subsections

      // Verify all main sections are present
      const mainSectionTitles = termsSections
        .filter(section => section.level === 2)
        .map(section => section.title);

      expect(mainSectionTitles).toHaveLength(12);
      expect(mainSectionTitles).toContain('1. Introduction');
      expect(mainSectionTitles).toContain('12. Contact');

      // Verify structure integrity
      termsSections.forEach(section => {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect([1, 2, 3]).toContain(section.level);
      });
    });

    it('has correct metadata', () => {
      expect(termsFooterLinks).toEqual([{ href: '/privacy', label: 'Privacy Policy' }]);
      expect(termsLastUpdated).toBe('December 11, 2025');
    });
  });

  describe('Privacy Policy', () => {
    it('has valid structure and required sections', () => {
      expect(privacySections).toHaveLength(17); // 11 main sections + 6 subsections

      // Verify all main sections are present
      const mainSectionTitles = privacySections
        .filter(section => section.level === 2)
        .map(section => section.title);

      expect(mainSectionTitles).toHaveLength(11);
      expect(mainSectionTitles).toContain('1. Introduction');
      expect(mainSectionTitles).toContain('11. Contact Us');

      // Verify structure integrity
      privacySections.forEach(section => {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect([1, 2, 3]).toContain(section.level);
      });
    });

    it('has correct metadata', () => {
      expect(privacyFooterLinks).toEqual([{ href: '/terms', label: 'Terms of Service' }]);
      expect(privacyLastUpdated).toBe('December 11, 2025');
    });
  });
});