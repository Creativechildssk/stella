-- Stella catalog + per-user activity + single superadmin profile.

create table if not exists photographers (
  slug text primary key,
  name text not null,
  city text not null default '',
  country text not null default '',
  bio text not null default '',
  avatar text not null default '',
  cover text not null default '',
  level integer not null default 1,
  followers integer not null default 0,
  following integer not null default 0,
  gear text not null default '[]',
  joined text not null default '',
  owner_user_id text
);

create table if not exists photos (
  id text primary key,
  title text not null,
  photographer_slug text not null references photographers (slug) on delete cascade,
  owner_user_id text,
  category text not null,
  src text not null,
  width integer not null,
  height integer not null,
  stars integer not null default 0,
  views integer not null default 0,
  location text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  featured boolean not null default false,
  photo_of_the_day boolean not null default false,
  camera text not null default '',
  lens text not null default '',
  focal text not null default '',
  aperture text not null default '',
  shutter text not null default '',
  iso text not null default ''
);

create index if not exists photos_category_idx on photos (category);
create index if not exists photos_featured_idx on photos (featured);
create index if not exists photos_created_idx on photos (created_at desc);

create table if not exists missions (
  id text primary key,
  title text not null,
  brief text not null default '',
  cover text not null default '',
  category text not null,
  ends_at timestamptz not null,
  prize text not null default '',
  curator text not null default ''
);

create table if not exists mission_entries (
  mission_id text not null references missions (id) on delete cascade,
  photo_id text not null references photos (id) on delete cascade,
  primary key (mission_id, photo_id)
);

create table if not exists comments (
  id text primary key,
  photo_id text not null references photos (id) on delete cascade,
  user_id text not null,
  author text not null,
  avatar text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_photo_idx on comments (photo_id, created_at);

create table if not exists stars (
  user_id text not null,
  photo_id text not null references photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);

create table if not exists saves (
  user_id text not null,
  photo_id text not null references photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);

create table if not exists follows (
  user_id text not null,
  photographer_slug text not null references photographers (slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, photographer_slug)
);

create table if not exists star_days (
  user_id text not null,
  day text not null,
  remaining integer not null default 5,
  primary key (user_id, day)
);

create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  email text not null default '',
  slug text unique,
  bio text not null default '',
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_one_superadmin
  on profiles (role)
  where role = 'superadmin';
