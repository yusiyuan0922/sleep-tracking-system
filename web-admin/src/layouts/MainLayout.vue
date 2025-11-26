<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="layout-aside">
      <div class="logo">睡眠小程序管理后台</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="base">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>基础管理</span>
          </template>
          <el-menu-item index="/hospital">医院管理</el-menu-item>
          <el-menu-item index="/doctor">医生管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="patient">
          <template #title>
            <el-icon><User /></el-icon>
            <span>患者管理</span>
          </template>
          <el-menu-item index="/patient">患者列表</el-menu-item>
          <el-menu-item index="/stage-record">阶段记录</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="clinical">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>临床数据</span>
          </template>
          <el-menu-item index="/scale">量表管理</el-menu-item>
          <el-menu-item index="/medication">用药记录</el-menu-item>
          <el-menu-item index="/adverse-event">不良事件</el-menu-item>
          <el-menu-item index="/medical-file">病历文件</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><Avatar /></el-icon>
              <span>{{ userInfo?.name || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);
const userInfo = computed(() => userStore.userInfo);

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title);
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string,
  }));
});

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.clearToken();
    ElMessage.success('退出成功');
    router.push('/login');
  }
};
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: #2b3a4e;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
