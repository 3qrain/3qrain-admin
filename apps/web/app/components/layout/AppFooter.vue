<script setup lang="ts">
const store = useAppStore()
const year = useState('site-current-year', () => new Date().getFullYear())
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <p class="name">{{ store.site.name || '3qrain' }}</p>
        <p class="desc">人生若只如初见</p>
      </div>
      <div class="links">
        <NuxtLink to="/posts">文章</NuxtLink>
        <NuxtLink to="/notes">说说</NuxtLink>
        <NuxtLink to="/friends">友链</NuxtLink>
      </div>
      <p class="copy">© {{ year }} · 3qrain</p>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 2rem;
  align-items: end;
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

@media (max-width: 640px) {
  .footer {
    padding-top: 3rem;
  }

  .footer-inner {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .links {
    flex-wrap: wrap;
  }
}
</style>
