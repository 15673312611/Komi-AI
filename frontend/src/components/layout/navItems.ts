/*
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { computed } from 'vue'
import { permissionChecks } from '@/utils/permissions'
import { canAccessPath } from '@/router/routePermissions'
import { useEnterpriseFeatures } from '@/composables/useEnterpriseFeatures'

export { NAV_ICONS, navIconSvg } from './navIcons'

export interface NavItem {
  to?: string
  icon?: string
  label?: string
  section?: string
  show?: boolean
}

export interface NavGroup {
  section: string
  items: NavItem[]
}

export const formatBadgeCount = (count?: number) =>
  count && count > 99 ? '99+' : String(count || '')

export const PRIMARY_NAV_PATHS = ['/conversations', '/stores', '/people', '/ai-agents', '/analytics']

export function useNavItems() {
  const { hasEnterpriseModule } = useEnterpriseFeatures()

  const navGroups = computed<NavGroup[]>(() =>
    [
      {
        section: '主菜单',
        items: [
          {
            to: '/ai-agents',
            icon: 'agents',
            label: 'AI 智能体',
            show: canAccessPath('/ai-agents'),
          },
          {
            to: '/human-agents',
            icon: 'humans',
            label: '团队与坐席',
            show: canAccessPath('/human-agents'),
          },
          {
            to: '/conversations',
            icon: 'inbox',
            label: '会话收件箱',
            show: canAccessPath('/conversations'),
          },
          {
            to: '/stores',
            icon: 'stores',
            label: '店铺管理',
            show: canAccessPath('/stores'),
          },
          {
            to: '/tickets',
            icon: 'tickets',
            label: '工单中心',
            show: canAccessPath('/tickets'),
          },
          {
            to: '/people',
            icon: 'people',
            label: '客户档案 (CRM)',
            show: canAccessPath('/people'),
          },
          {
            to: '/knowledge',
            icon: 'knowledge',
            label: '知识库',
            show: canAccessPath('/knowledge'),
          },
          {
            to: '/faq',
            icon: 'faq',
            label: '帮助中心',
            show: canAccessPath('/faq'),
          },
          {
            to: '/analytics',
            icon: 'analytics',
            label: '数据分析',
            show: canAccessPath('/analytics'),
          },
        ],
      },
      {
        section: '系统设置',
        items: [
          {
            to: '/settings/organization',
            icon: 'org',
            label: '组织设置',
            show: canAccessPath('/settings/organization'),
          },
          {
            to: '/settings/subscription',
            icon: 'subscription',
            label: '订阅管理',
            show: hasEnterpriseModule && permissionChecks.canViewSubscription(),
          },
          {
            to: '/settings/ticketing',
            icon: 'ticketing',
            label: '工单配置',
            show: canAccessPath('/settings/ticketing'),
          },
          {
            to: '/settings/integrations',
            icon: 'integrations',
            label: '渠道集成',
            show: canAccessPath('/settings/integrations'),
          },
          {
            to: '/settings/widget-apps',
            icon: 'widgets',
            label: '挂件应用',
            show: canAccessPath('/settings/widget-apps'),
          },
          {
            to: '/settings/ai-config',
            icon: 'aiconfig',
            label: 'AI 模型配置',
            show: canAccessPath('/settings/ai-config'),
          },
          {
            to: '/settings/canned-responses',
            icon: 'responses',
            label: '快捷话术',
            show: canAccessPath('/settings/canned-responses'),
          },
          {
            to: '/settings/user',
            icon: 'usersettings',
            label: '个人设置',
            show: true,
          },
        ],
      },
    ]
      .map((group) => ({ ...group, items: group.items.filter((item) => item.show !== false) }))
      .filter((group) => group.items.length > 0),
  )

  const navItems = computed<NavItem[]>(() =>
    navGroups.value.flatMap((group) => [{ section: group.section }, ...group.items]),
  )

  const primaryNavItems = computed<NavItem[]>(() =>
    PRIMARY_NAV_PATHS.map((path) => navItems.value.find((item) => item.to === path)).filter(
      (item): item is NavItem => !!item,
    ),
  )

  const moreNavGroups = computed<NavGroup[]>(() =>
    navGroups.value
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.to && !PRIMARY_NAV_PATHS.includes(item.to)),
      }))
      .filter((group) => group.items.length > 0),
  )

  const moreNavItems = computed<NavItem[]>(() =>
    moreNavGroups.value.flatMap((group) => group.items),
  )

  return { navGroups, navItems, primaryNavItems, moreNavItems, moreNavGroups }
}
