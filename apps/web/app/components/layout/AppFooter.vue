<script setup lang="ts">
const store = useAppStore()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div>
        <p class="name">{{ store.site.name || '3qrain' }}</p>
        <p class="desc">{{ store.site.bio || '写作、记录与一点点生活现场。' }}</p>
      </div>
      <div class="links">
        <NuxtLink to="/posts">文章</NuxtLink>
        <NuxtLink to="/notes">说说</NuxtLink>
        <NuxtLink to="/friends">友链</NuxtLink>
      </div>
      <p class="copy">© {{ year }} 3qrain blog</p>
    </div>
  </footer>
</template>

<style scoped lang="less">
.footer {
  padding: 4rem 1rem 2.5rem;
}

.footer-inner {
  width: min(var(--site-max), 100%);
  margin: 0 auto;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem 2rem;
  align-items: start;
}

.name {
  font-size: 0.875rem;
  font-weight: 800;
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
  grid-column: 1 / -1;
}

@media (max-width: 640px) {
  .footer {
    padding-top: 3rem;
  }

  .footer-inner {
    grid-template-columns: 1fr;
  }

  .links {
    flex-wrap: wrap;
  }
}
</style>
