import { Task, TaskState } from '../types'
import { TAB_GROUP_COLORS } from './constants'
import { STORAGE_KEYS } from './constants'

/**
 * Chrome storage API wrapper
 */
export const chromeStorage = {
  /**
   * Get data from Chrome storage
   */
  get: async <T = any>(key: string): Promise<T | null> => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage get error:', chrome.runtime.lastError)
          resolve(null)
        } else {
          resolve(result[key] || null)
        }
      })
    })
  },

  /**
   * Set data in Chrome storage
   */
  set: async (key: string, value: any): Promise<boolean> => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage set error:', chrome.runtime.lastError)
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  },

  /**
   * Remove data from Chrome storage
   */
  remove: async (key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage remove error:', chrome.runtime.lastError)
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }
}

/**
 * Chrome tabs API wrapper
 */
export const chromeTabs = {
  /**
   * Create a new tab with URL
   */
  create: async (url: string): Promise<chrome.tabs.Tab | null> => {
    return new Promise((resolve) => {
      chrome.tabs.create({ url }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome tabs create error:', chrome.runtime.lastError)
          resolve(null)
        } else {
          resolve(tab)
        }
      })
    })
  },

  /**
   * Create multiple tabs
   */
  createMultiple: async (urls: string[]): Promise<chrome.tabs.Tab[]> => {
    const tabs: chrome.tabs.Tab[] = []
    
    for (const url of urls) {
      const tab = await chromeTabs.create(url)
      if (tab) {
        tabs.push(tab)
      }
    }
    
    return tabs
  }
}

/**
 * Chrome tab groups API wrapper
 */
export const chromeTabGroups = {
  /**
   * Create a new tab group
   */
  create: async (options: {
    tabIds?: number[]
    title?: string
    color?: string
    collapsed?: boolean
  } = {}): Promise<any> => {
    return new Promise((resolve) => {
      // Check if tab groups API is available
      if (!chrome.tabGroups) {
        console.log('Chrome tab groups API not available - feature not supported in this Chrome version')
        resolve(null)
        return
      }
      
      // Use any type to avoid TypeScript issues with experimental APIs
      const tabGroupsApi = chrome.tabGroups as any
      
      if (!tabGroupsApi.create) {
        console.log('Chrome tab groups create API not available - feature not supported in this Chrome version')
        resolve(null)
        return
      }
      
      tabGroupsApi.create(options, (group: any) => {
        if (chrome.runtime.lastError) {
          console.log('Chrome tab groups create error (non-critical):', chrome.runtime.lastError.message)
          resolve(null)
        } else {
          console.log('Tab group created successfully:', group)
          resolve(group)
        }
      })
    })
  },

  /**
   * Update a tab group
   */
  update: async (
    groupId: number,
    updateProperties: {
      title?: string
      color?: string
      collapsed?: boolean
    }
  ): Promise<any> => {
    return new Promise((resolve) => {
      if (!chrome.tabGroups) {
        console.error('Chrome tab groups API not available')
        resolve(null)
        return
      }
      
      const tabGroupsApi = chrome.tabGroups as any
      
      if (!tabGroupsApi.update) {
        console.error('Chrome tab groups update API not available')
        resolve(null)
        return
      }
      
      tabGroupsApi.update(groupId, updateProperties, (group: any) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome tab groups update error:', chrome.runtime.lastError)
          resolve(null)
        } else {
          resolve(group)
        }
      })
    })
  },

  /**
   * Remove a tab group (close all tabs in the group)
   */
  remove: async (groupId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!chrome.tabs) {
        console.error('Chrome tabs API not available')
        resolve(false)
        return
      }
      
      // Get tabs in the group and close them
      chrome.tabs.query({ groupId }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome tabs query error:', chrome.runtime.lastError)
          resolve(false)
          return
        }
        
        const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined)
        if (tabIds.length === 0) {
          resolve(true)
          return
        }
        
        chrome.tabs.remove(tabIds, () => {
          if (chrome.runtime.lastError) {
            console.error('Chrome tabs remove error:', chrome.runtime.lastError)
            resolve(false)
          } else {
            resolve(true)
          }
        })
      })
    })
  },

  /**
   * Get a random color for tab groups
   */
  getRandomColor: (): string => {
    const randomIndex = Math.floor(Math.random() * TAB_GROUP_COLORS.length)
    return TAB_GROUP_COLORS[randomIndex]
  },

  /**
   * Create tab group using chrome.tabs.group (more stable alternative)
   */
  createWithTabsGroup: async (tabIds: number[], title: string, color?: string): Promise<{ id: number; title: string } | null> => {
    return new Promise((resolve) => {
      try {
        // Step 1: Group the tabs using chrome.tabs.group
        chrome.tabs.group({ tabIds }, (groupId) => {
          if (chrome.runtime.lastError) {
            console.log('Chrome tabs.group error:', chrome.runtime.lastError.message)
            resolve(null)
            return
          }

          // Step 2: Update the group properties using chrome.tabGroups.update
          chrome.tabGroups.update(groupId, {
            title,
            color: (color || chromeTabGroups.getRandomColor()) as any
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Chrome tabGroups.update error:', chrome.runtime.lastError.message)
              resolve(null)
            } else {
              console.log('Tab group created successfully with chrome.tabs.group:', groupId)
              resolve({ id: groupId, title })
            }
          })
        })
      } catch (error) {
        console.log('Tab group creation failed:', error)
        resolve(null)
      }
    })
  },

  /**
   * Find tab group by title (used to find groups associated with tasks)
   */
  findByTitle: async (title: string): Promise<{ id: number; title: string } | null> => {
    return new Promise((resolve) => {
      if (!chrome.tabGroups) {
        console.log('Chrome tab groups API not available')
        resolve(null)
        return
      }

      chrome.tabGroups.query({}, (groups) => {
        if (chrome.runtime.lastError) {
          console.log('Chrome tab groups query error:', chrome.runtime.lastError.message)
          resolve(null)
          return
        }

        const matchingGroup = groups.find(group => group.title === title)
        if (matchingGroup) {
          resolve({ id: matchingGroup.id, title: matchingGroup.title || '' })
        } else {
          resolve(null)
        }
      })
    })
  },

  /**
   * Get the current active tab's group information
   */
  getCurrentTabGroup: async (): Promise<{ id: number; title: string } | null> => {
    return new Promise((resolve) => {
      if (!chrome.tabs || !chrome.tabGroups) {
        console.log('Chrome tabs or tab groups API not available')
        resolve(null)
        return
      }

      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          console.log('No active tab found')
          resolve(null)
          return
        }

        const activeTab = tabs[0]
        if (activeTab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
          console.log('Active tab is not in a group')
          resolve(null)
          return
        }

        // Get the group information
        chrome.tabGroups.get(activeTab.groupId, (group) => {
          if (chrome.runtime.lastError) {
            console.log('Error getting tab group:', chrome.runtime.lastError.message)
            resolve(null)
            return
          }

          resolve({ id: group.id, title: group.title || '' })
        })
      })
    })
  },

  /**
   * Focus on an existing tab group (bring it to foreground)
   */
  focusGroup: async (groupId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!chrome.tabGroups) {
        console.log('Chrome tab groups API not available')
        resolve(false)
        return
      }

      // First, get all tabs in the group
      chrome.tabs.query({ groupId }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.log('Chrome tabs query error:', chrome.runtime.lastError.message)
          resolve(false)
          return
        }

        if (tabs.length === 0) {
          console.log('No tabs found in group:', groupId)
          resolve(false)
          return
        }

        // Focus on the first tab in the group
        const firstTab = tabs[0]
        if (firstTab.id) {
          chrome.tabs.update(firstTab.id, { active: true }, (tab) => {
            if (chrome.runtime.lastError) {
              console.log('Chrome tabs update error:', chrome.runtime.lastError.message)
              resolve(false)
            } else {
              console.log('Focused on tab group:', groupId)
              resolve(true)
            }
          })
        } else {
          resolve(false)
        }
      })
    })
  }
}

/**
 * Task storage operations
 */
export const taskStorage = {
  /**
   * Get all tasks from storage
   */
  getTasks: async (): Promise<Task[]> => {
    const tasks = await chromeStorage.get<Task[]>(STORAGE_KEYS.TASKS)
    return tasks || []
  },

  /**
   * Save tasks to storage
   */
  saveTasks: async (tasks: Task[]): Promise<boolean> => {
    return chromeStorage.set(STORAGE_KEYS.TASKS, tasks)
  },

  /**
   * Add a new task
   */
  addTask: async (task: Task): Promise<boolean> => {
    const tasks = await taskStorage.getTasks()
    const updatedTasks = [...tasks, task]
    return taskStorage.saveTasks(updatedTasks)
  },

  /**
   * Update an existing task
   */
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
    const tasks = await taskStorage.getTasks()
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    
    if (taskIndex === -1) {
      return false
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    return taskStorage.saveTasks(tasks)
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string): Promise<boolean> => {
    const tasks = await taskStorage.getTasks()
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    return taskStorage.saveTasks(updatedTasks)
  }
}
