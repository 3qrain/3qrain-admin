<script setup lang="ts">
import { Radio } from '@lucide/vue'

const store = useAppStore()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-main">
        <div class="footer-brand">
          <p class="name">{{ store.site.name || '3qrain' }}</p>
          <p v-if="store.site.motto" class="desc">{{ store.site.motto }}</p>
        </div>
        <nav class="links" aria-label="页脚导航">
          <NuxtLink to="/posts">文章</NuxtLink>
          <NuxtLink to="/notes">说说</NuxtLink>
          <NuxtLink to="/friends">友链</NuxtLink>
        </nav>
      </div>

      <div class="footer-meta">
        <div
          :class="['presence', { connected: store.wsConnected }]"
          aria-live="polite"
          aria-atomic="true"
        >
          <span class="presence-signal" aria-hidden="true">
            <Radio :size="13" :stroke-width="1.8" />
          </span>
          <span class="presence-copy">
            <Transition name="presence-swap">
              <span :key="store.wsConnected ? store.onlineVisitors : 'connecting'" class="presence-text">
                <template v-if="store.wsConnected">
                  此刻 <strong>{{ store.onlineVisitors }}</strong> 人在线
                </template>
                <template v-else>正在连接</template>
              </span>
            </Transition>
          </span>
        </div>

        <div class="legal">
          <p v-if="store.site.copyright" class="copy">{{ store.site.copyright }}</p>
          <a
            v-if="store.site.filingNumber && store.site.filingUrl"
            :href="store.site.filingUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ store.site.filingNumber }}
          </a>
          <span v-else-if="store.site.filingNumber">{{ store.site.filingNumber }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="less">
.footer {
  padding: 5rem 1rem 2.25rem;
}

.footer-inner {
  width: min(var(--site-max), 100%);
  margin: 0 auto;
}

.footer-main,
.footer-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
}

.footer-main {
  align-items: end;
}

.footer-meta {
  align-items: center;
  margin-top: 2.25rem;
}

.footer-brand {
  max-width: 28rem;
}

.name {
  font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
  font-size: 1rem;
  font-weight: 700;
}

.desc,
.copy {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-subtle);
}

.links {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-muted);

  a {
    transition: color 0.15s;

    &:hover {
      color: var(--color-base-content);
    }
  }
}

.copy {
  margin: 0;
  white-space: nowrap;
}

.legal {
  display: flex;
  align-items: center;
  justify-self: end;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;

  a,
  span {
    color: var(--color-subtle);
    font-size: 0.75rem;
  }

  a {
    transition: color 0.15s ease;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.presence {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 0.3rem;
  color: var(--color-subtle);
  font-size: 0.7rem;
  line-height: 1rem;
  white-space: nowrap;

  &.connected {
    color: var(--color-muted);
  }
}

.presence-signal {
  position: relative;
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 1rem;
  color: var(--color-subtle);

  .connected & {
    color: var(--color-primary);
  }

  svg {
    display: block;
    transform-origin: center;
  }

  .connected & svg {
    animation: signal-breathe 2.4s ease-in-out infinite;
  }

  .connected &::after {
    content: '';
    position: absolute;
    inset: -0.2rem;
    border: 1px solid var(--color-primary);
    border-radius: 50%;
    transform-origin: center;
    animation: signal-wave 2.4s ease-out infinite;
  }
}

.presence-text {
  display: inline-block;
  line-height: 1rem;

  strong {
    color: var(--color-primary);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
  }
}

.presence-copy {
  display: grid;
  text-align: left;

  .presence-text {
    grid-area: 1 / 1;
  }
}

.presence-swap-enter-active,
.presence-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.presence-swap-enter-from {
  opacity: 0;
  transform: translateY(0.2rem);
}

.presence-swap-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}

@keyframes signal-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes signal-wave {
  0% {
    opacity: 0.4;
    transform: scale(0.7);
  }
  65%,
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@media (max-width: 768px) {
  .footer {
    padding-top: 3rem;
  }

  .footer-main,
  .footer-meta {
    grid-template-columns: 1fr;
    gap: 1.15rem;
  }

  .links {
    flex-wrap: wrap;
  }

  .footer-meta {
    margin-top: 2rem;
  }

  .presence {
    justify-self: start;
  }

  .legal {
    justify-self: start;
    justify-content: flex-start;
  }
}
</style>
