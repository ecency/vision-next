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
  | 'team';

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
