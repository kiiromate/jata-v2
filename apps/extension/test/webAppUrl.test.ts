import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createWebAppUrl,
  isTrustedWebAppOrigin,
  resolveWebAppOrigin,
} from '../src/lib/webAppUrl.ts';

describe('extension web app URLs', () => {
  it('builds sign-in and dashboard links from the configured web app origin', () => {
    const env = {
      DEV: false,
      VITE_JATA_WEB_APP_URL: 'https://preview-jata.vercel.app/',
    };

    assert.equal(createWebAppUrl('/signin', env), 'https://preview-jata.vercel.app/signin');
    assert.equal(createWebAppUrl('/dashboard', env), 'https://preview-jata.vercel.app/dashboard');
  });

  it('normalizes Vercel preview URLs when no explicit web app origin is configured', () => {
    const env = {
      DEV: false,
      VITE_VERCEL_URL: 'jata-git-auth-sync-kaze.vercel.app',
    };

    assert.equal(resolveWebAppOrigin(env), 'https://jata-git-auth-sync-kaze.vercel.app');
  });

  it('defaults to the local web app during extension development', () => {
    const env = { DEV: true };

    assert.equal(resolveWebAppOrigin(env), 'http://localhost:5173');
  });

  it('trusts the same local, preview, and production origins used for auth sync', () => {
    const env = { VITE_JATA_WEB_APP_URL: 'https://staging.jata.example' };

    assert.equal(isTrustedWebAppOrigin('https://staging.jata.example', env), true);
    assert.equal(isTrustedWebAppOrigin('http://localhost:5173'), true);
    assert.equal(isTrustedWebAppOrigin('http://localhost:4173'), true);
    assert.equal(isTrustedWebAppOrigin('https://jata-git-auth-sync-kaze.vercel.app'), true);
    assert.equal(isTrustedWebAppOrigin('https://jata.app'), true);
    assert.equal(isTrustedWebAppOrigin('https://example.com'), false);
  });
});
