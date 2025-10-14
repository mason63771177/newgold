// 获取用户当前状态
function getCurrentUserState() {
  try {
    // 从localStorage获取应用状态
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.currentState || 1;
    }
    
    // 如果没有保存的状态，尝试从其他地方获取
    const userStatus = localStorage.getItem('userStatus');
    if (userStatus) {
      return parseInt(userStatus);
    }
    
    // 默认返回状态1
    return 1;
  } catch (error) {
    console.warn('获取用户状态失败:', error);
    return 1;
  }
}

// 智能返回函数 - 根据用户状态返回到正确的主页面
function smartBack() {
  // 检查是否有浏览历史记录
  if (document.referrer && document.referrer.includes(window.location.origin)) {
    // 如果有同域的来源页面，使用浏览器返回
    history.back();
  } else {
    // 如果没有历史记录或来源不是同域，根据用户状态返回到对应的主页面
    const currentState = getCurrentUserState();
    
    // 根据状态返回到对应的主页面
    // 所有状态都返回到index.html，但会根据状态显示不同的内容
    window.location.href = 'index.html';
  }
}

// 为了兼容性，也可以根据当前页面返回到特定页面
function smartBackToParent() {
  const currentPage = window.location.pathname.split('/').pop();
  
  // 定义页面的父页面关系
  const pageParents = {
    'wallet.html': 'index.html',
    'withdraw.html': 'wallet.html',
    'transaction.html': 'wallet.html',
    'tasks.html': 'index.html',
    'team.html': 'index.html',
    'team_member.html': 'team.html',
    'ranking.html': 'index.html',
    'ranking_user.html': 'ranking.html',
    'redpacket.html': 'index.html',
    'quiz.html': 'tasks.html',
    'invite.html': 'index.html',
    'activation.html': 'index.html',
    'record.html': 'index.html'
  };
  
  // 检查是否有浏览历史记录
  if (document.referrer && document.referrer.includes(window.location.origin)) {
    history.back();
  } else {
    // 获取用户当前状态
    const currentState = getCurrentUserState();
    
    // 对于直接返回到index.html的页面，确保返回到正确的状态页面
    const parentPage = pageParents[currentPage];
    if (parentPage === 'index.html') {
      // 返回到主页面，主页面会根据currentState显示正确的状态内容
      window.location.href = 'index.html';
    } else {
      // 返回到其他特定页面
      window.location.href = parentPage || 'index.html';
    }
  }
}

// 状态感知的返回函数 - 确保返回到正确的状态页面
function stateAwareBack() {
  const currentState = getCurrentUserState();
  
  // 检查是否有浏览历史记录
  if (document.referrer && document.referrer.includes(window.location.origin)) {
    // 如果来源页面是index.html，直接使用浏览器返回
    if (document.referrer.includes('index.html')) {
      history.back();
      return;
    }
  }
  
  // 否则返回到主页面，让主页面根据状态显示正确内容
  window.location.href = 'index.html';
}