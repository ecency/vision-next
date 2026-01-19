import { InstanceConfigManager } from './configuration-loader';

// Translation keys used throughout the app
type TranslationKey =
  | 'loading'
  | 'loadingPost'
  | 'loadingMore'
  | 'postNotFound'
  | 'noPosts'
  | 'followers'
  | 'following'
  | 'hiveInfo'
  | 'reputation'
  | 'joined'
  | 'posts'
  | 'location'
  | 'website'
  | 'likes'
  | 'comments'
  | 'reblogs'
  | 'replies'
  | 'blog'
  | 'newest'
  | 'trending'
  | 'authorReputation'
  | 'votes'
  | 'discussion'
  | 'readTime'
  | 'minRead'
  | 'login'
  | 'logout'
  | 'login_to_comment'
  | 'login_to_vote'
  | 'login_to_reblog'
  | 'write_comment'
  | 'posting'
  | 'post_comment'
  | 'create_post'
  | 'subscribers'
  | 'authors'
  | 'community_info'
  | 'created'
  | 'language'
  | 'pending_posts'
  | 'team'
  | 'search'
  | 'searching'
  | 'search_error'
  | 'no_results'
  | 'results_for'
  | 'enter_search_query'
  | 'listen'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'reblogging'
  | 'reblog_confirm'
  | 'cant_reblog_own'
  | 'already_reblogged'
  | 'reblog_to_followers'
  | 'error_loading'
  | 'retry';

type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
  en: {
    loading: 'Loading...',
    loadingPost: 'Loading post...',
    loadingMore: 'Loading more posts...',
    postNotFound: 'Post not found.',
    noPosts: 'No posts found.',
    followers: 'Followers',
    following: 'Following',
    hiveInfo: 'Hive Info',
    reputation: 'Reputation',
    joined: 'Joined',
    posts: 'Posts',
    location: 'Location',
    website: 'Website',
    likes: 'likes',
    comments: 'comments',
    reblogs: 'reblogs',
    replies: 'Replies',
    blog: 'Blog',
    newest: 'Newest',
    trending: 'Trending',
    authorReputation: 'Author Reputation',
    votes: 'Votes',
    discussion: 'Discussion',
    readTime: 'read',
    minRead: 'min read',
    login: 'Login',
    logout: 'Logout',
    login_to_comment: 'Login to leave a comment',
    login_to_vote: 'Login to vote',
    login_to_reblog: 'Login to reblog',
    write_comment: 'Write a comment...',
    posting: 'Posting...',
    post_comment: 'Post Comment',
    create_post: 'Create Post',
    subscribers: 'Subscribers',
    authors: 'Authors',
    community_info: 'Community Info',
    created: 'Created',
    language: 'Language',
    pending_posts: 'Pending Posts',
    team: 'Team',
    search: 'Search',
    searching: 'Searching...',
    search_error: 'Search failed. Please try again.',
    no_results: 'No results found.',
    results_for: 'results for',
    enter_search_query: 'Enter a search term to find posts.',
    listen: 'Listen',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    reblogging: 'Reblogging...',
    reblog_confirm: 'Are you sure you want to reblog this post to your followers?',
    cant_reblog_own: "You can't reblog your own post",
    already_reblogged: 'Already reblogged',
    reblog_to_followers: 'Reblog to your followers',
    error_loading: 'Something went wrong. Please try again.',
    retry: 'Retry',
  },
  es: {
    loading: 'Cargando...',
    loadingPost: 'Cargando publicación...',
    loadingMore: 'Cargando más publicaciones...',
    postNotFound: 'Publicación no encontrada.',
    noPosts: 'No se encontraron publicaciones.',
    followers: 'Seguidores',
    following: 'Siguiendo',
    hiveInfo: 'Info de Hive',
    reputation: 'Reputación',
    joined: 'Se unió',
    posts: 'Publicaciones',
    location: 'Ubicación',
    website: 'Sitio web',
    likes: 'me gusta',
    comments: 'comentarios',
    reblogs: 'reblogueos',
    replies: 'Respuestas',
    blog: 'Blog',
    newest: 'Más reciente',
    trending: 'Tendencia',
    authorReputation: 'Reputación del autor',
    votes: 'Votos',
    discussion: 'Discusión',
    readTime: 'lectura',
    minRead: 'min de lectura',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    login_to_comment: 'Inicia sesión para comentar',
    login_to_vote: 'Inicia sesión para votar',
    login_to_reblog: 'Inicia sesión para rebloguear',
    write_comment: 'Escribe un comentario...',
    posting: 'Publicando...',
    post_comment: 'Publicar comentario',
    create_post: 'Crear publicación',
    subscribers: 'Suscriptores',
    authors: 'Autores',
    community_info: 'Info de Comunidad',
    created: 'Creado',
    language: 'Idioma',
    pending_posts: 'Posts Pendientes',
    team: 'Equipo',
    search: 'Buscar',
    searching: 'Buscando...',
    search_error: 'Error en la búsqueda. Intente de nuevo.',
    no_results: 'No se encontraron resultados.',
    results_for: 'resultados para',
    enter_search_query: 'Ingrese un término para buscar publicaciones.',
    listen: 'Escuchar',
    pause: 'Pausar',
    resume: 'Reanudar',
    stop: 'Detener',
    reblogging: 'Reblogueando...',
    reblog_confirm: '¿Estás seguro de que quieres rebloguear esta publicación a tus seguidores?',
    cant_reblog_own: 'No puedes rebloguear tu propia publicación',
    already_reblogged: 'Ya reblogueado',
    reblog_to_followers: 'Rebloguear a tus seguidores',
    error_loading: 'Algo salió mal. Por favor, intente de nuevo.',
    retry: 'Reintentar',
  },
  de: {
    loading: 'Lädt...',
    loadingPost: 'Beitrag wird geladen...',
    loadingMore: 'Weitere Beiträge laden...',
    postNotFound: 'Beitrag nicht gefunden.',
    noPosts: 'Keine Beiträge gefunden.',
    followers: 'Follower',
    following: 'Folgt',
    hiveInfo: 'Hive-Info',
    reputation: 'Reputation',
    joined: 'Beigetreten',
    posts: 'Beiträge',
    location: 'Standort',
    website: 'Webseite',
    likes: 'Gefällt mir',
    comments: 'Kommentare',
    reblogs: 'Reblogs',
    replies: 'Antworten',
    blog: 'Blog',
    newest: 'Neueste',
    trending: 'Trending',
    authorReputation: 'Autoren-Reputation',
    votes: 'Stimmen',
    discussion: 'Diskussion',
    readTime: 'Lesezeit',
    minRead: 'Min. Lesezeit',
    login: 'Anmelden',
    logout: 'Abmelden',
    login_to_comment: 'Melden Sie sich an, um zu kommentieren',
    login_to_vote: 'Melden Sie sich an, um abzustimmen',
    login_to_reblog: 'Melden Sie sich an, um zu rebloggen',
    write_comment: 'Schreibe einen Kommentar...',
    posting: 'Wird gepostet...',
    post_comment: 'Kommentar posten',
    create_post: 'Beitrag erstellen',
    subscribers: 'Abonnenten',
    authors: 'Autoren',
    community_info: 'Community-Info',
    created: 'Erstellt',
    language: 'Sprache',
    pending_posts: 'Ausstehende Beiträge',
    team: 'Team',
    search: 'Suchen',
    searching: 'Suche...',
    search_error: 'Suche fehlgeschlagen. Bitte erneut versuchen.',
    no_results: 'Keine Ergebnisse gefunden.',
    results_for: 'Ergebnisse für',
    enter_search_query: 'Geben Sie einen Suchbegriff ein.',
    listen: 'Anhören',
    pause: 'Pause',
    resume: 'Fortsetzen',
    stop: 'Stopp',
    reblogging: 'Rebloggen...',
    reblog_confirm: 'Möchten Sie diesen Beitrag wirklich an Ihre Follower rebloggen?',
    cant_reblog_own: 'Sie können Ihren eigenen Beitrag nicht rebloggen',
    already_reblogged: 'Bereits rebloggt',
    reblog_to_followers: 'An Ihre Follower rebloggen',
    error_loading: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
  },
  fr: {
    loading: 'Chargement...',
    loadingPost: "Chargement de l'article...",
    loadingMore: "Chargement d'autres articles...",
    postNotFound: 'Article non trouvé.',
    noPosts: 'Aucun article trouvé.',
    followers: 'Abonnés',
    following: 'Abonnements',
    hiveInfo: 'Info Hive',
    reputation: 'Réputation',
    joined: 'Inscrit',
    posts: 'Articles',
    location: 'Lieu',
    website: 'Site web',
    likes: "j'aime",
    comments: 'commentaires',
    reblogs: 'repartages',
    replies: 'Réponses',
    blog: 'Blog',
    newest: 'Plus récent',
    trending: 'Tendances',
    authorReputation: "Réputation de l'auteur",
    votes: 'Votes',
    discussion: 'Discussion',
    readTime: 'lecture',
    minRead: 'min de lecture',
    login: 'Connexion',
    logout: 'Déconnexion',
    login_to_comment: 'Connectez-vous pour commenter',
    login_to_vote: 'Connectez-vous pour voter',
    login_to_reblog: 'Connectez-vous pour repartager',
    write_comment: 'Écrire un commentaire...',
    posting: 'Publication...',
    post_comment: 'Publier le commentaire',
    create_post: 'Créer un article',
    subscribers: 'Abonnés',
    authors: 'Auteurs',
    community_info: 'Info Communauté',
    created: 'Créé',
    language: 'Langue',
    pending_posts: 'Articles en attente',
    team: 'Équipe',
    search: 'Rechercher',
    searching: 'Recherche...',
    search_error: 'La recherche a échoué. Veuillez réessayer.',
    no_results: 'Aucun résultat trouvé.',
    results_for: 'résultats pour',
    enter_search_query: 'Entrez un terme pour rechercher des articles.',
    listen: 'Écouter',
    pause: 'Pause',
    resume: 'Reprendre',
    stop: 'Arrêter',
    reblogging: 'Repartage...',
    reblog_confirm: 'Êtes-vous sûr de vouloir repartager cet article à vos abonnés?',
    cant_reblog_own: 'Vous ne pouvez pas repartager votre propre article',
    already_reblogged: 'Déjà repartagé',
    reblog_to_followers: 'Repartager à vos abonnés',
    error_loading: "Une erreur s'est produite. Veuillez réessayer.",
    retry: 'Réessayer',
  },
  ko: {
    loading: '로딩 중...',
    loadingPost: '게시물 로딩 중...',
    loadingMore: '더 많은 게시물 로딩 중...',
    postNotFound: '게시물을 찾을 수 없습니다.',
    noPosts: '게시물이 없습니다.',
    followers: '팔로워',
    following: '팔로잉',
    hiveInfo: 'Hive 정보',
    reputation: '평판',
    joined: '가입일',
    posts: '게시물',
    location: '위치',
    website: '웹사이트',
    likes: '좋아요',
    comments: '댓글',
    reblogs: '리블로그',
    replies: '답글',
    blog: '블로그',
    newest: '최신',
    trending: '인기',
    authorReputation: '작성자 평판',
    votes: '투표',
    discussion: '토론',
    readTime: '읽기',
    minRead: '분 읽기',
    login: '로그인',
    logout: '로그아웃',
    login_to_comment: '댓글을 남기려면 로그인하세요',
    login_to_vote: '투표하려면 로그인하세요',
    login_to_reblog: '리블로그하려면 로그인하세요',
    write_comment: '댓글 작성...',
    posting: '게시 중...',
    post_comment: '댓글 게시',
    create_post: '게시물 작성',
    subscribers: '구독자',
    authors: '작성자',
    community_info: '커뮤니티 정보',
    created: '생성됨',
    language: '언어',
    pending_posts: '대기 중인 게시물',
    team: '팀',
    search: '검색',
    searching: '검색 중...',
    search_error: '검색에 실패했습니다. 다시 시도해주세요.',
    no_results: '결과가 없습니다.',
    results_for: '검색 결과',
    enter_search_query: '검색어를 입력하세요.',
    listen: '듣기',
    pause: '일시정지',
    resume: '재개',
    stop: '정지',
    reblogging: '리블로그 중...',
    reblog_confirm: '이 게시물을 팔로워들에게 리블로그하시겠습니까?',
    cant_reblog_own: '자신의 게시물은 리블로그할 수 없습니다',
    already_reblogged: '이미 리블로그됨',
    reblog_to_followers: '팔로워에게 리블로그',
    error_loading: '문제가 발생했습니다. 다시 시도해주세요.',
    retry: '다시 시도',
  },
  ru: {
    loading: 'Загрузка...',
    loadingPost: 'Загрузка поста...',
    loadingMore: 'Загрузка постов...',
    postNotFound: 'Пост не найден.',
    noPosts: 'Посты не найдены.',
    followers: 'Подписчики',
    following: 'Подписки',
    hiveInfo: 'Инфо Hive',
    reputation: 'Репутация',
    joined: 'Присоединился',
    posts: 'Посты',
    location: 'Местоположение',
    website: 'Веб-сайт',
    likes: 'лайков',
    comments: 'комментариев',
    reblogs: 'реблогов',
    replies: 'Ответы',
    blog: 'Блог',
    newest: 'Новые',
    trending: 'Популярные',
    authorReputation: 'Репутация автора',
    votes: 'Голоса',
    discussion: 'Обсуждение',
    readTime: 'чтение',
    minRead: 'мин чтения',
    login: 'Вход',
    logout: 'Выход',
    login_to_comment: 'Войдите, чтобы оставить комментарий',
    login_to_vote: 'Войдите, чтобы проголосовать',
    login_to_reblog: 'Войдите, чтобы сделать реблог',
    write_comment: 'Написать комментарий...',
    posting: 'Публикация...',
    post_comment: 'Опубликовать',
    create_post: 'Создать пост',
    subscribers: 'Подписчики',
    authors: 'Авторы',
    community_info: 'Информация о сообществе',
    created: 'Создано',
    language: 'Язык',
    pending_posts: 'Ожидающие посты',
    team: 'Команда',
    search: 'Поиск',
    searching: 'Поиск...',
    search_error: 'Ошибка поиска. Попробуйте снова.',
    no_results: 'Результаты не найдены.',
    results_for: 'результатов для',
    enter_search_query: 'Введите поисковый запрос.',
    listen: 'Слушать',
    pause: 'Пауза',
    resume: 'Продолжить',
    stop: 'Стоп',
    reblogging: 'Реблог...',
    reblog_confirm: 'Вы уверены, что хотите сделать реблог этого поста для ваших подписчиков?',
    cant_reblog_own: 'Вы не можете сделать реблог своего поста',
    already_reblogged: 'Уже сделан реблог',
    reblog_to_followers: 'Сделать реблог для подписчиков',
    error_loading: 'Что-то пошло не так. Пожалуйста, попробуйте снова.',
    retry: 'Повторить',
  },
};

/**
 * Get a translated string for the given key
 */
export function t(key: TranslationKey): string {
  const language = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.language,
  );

  const langTranslations = translations[language] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
}

/**
 * Get the current language code
 */
export function getCurrentLanguage(): string {
  return InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.language,
  );
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): boolean {
  return lang in translations;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(translations);
}
