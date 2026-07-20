create table workouts (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null unique,
  name text not null,
  exercises jsonb not null default '[]'::jsonb
);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  workout_id uuid references workouts(id),
  exercise text not null,
  sets integer,
  reps text,
  weight numeric,
  rpe numeric,
  notes text,
  completed boolean not null default false,
  unique (workout_id, date, exercise)
);

create table groceries (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null default 'Autre',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '',
  created_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  unique (habit_id, date)
);

alter table workouts disable row level security;
alter table workout_logs disable row level security;
alter table groceries disable row level security;
alter table habits disable row level security;
alter table habit_logs disable row level security;

insert into workouts (day_of_week, name, exercises) values
('monday', 'Legs Force', '[
  {"name": "Back squat", "sets": 4, "reps": "5"},
  {"name": "Bulgarian split squat", "sets": 3, "reps": "8/jambe"},
  {"name": "Nordic curl", "sets": 3, "reps": "6"},
  {"name": "Tibialis raises + Copenhagen plank (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('tuesday', 'Pull + Kettlebell', '[
  {"name": "Tractions lestées", "sets": 5, "reps": "5"},
  {"name": "KB swings", "sets": 4, "reps": "15"},
  {"name": "Rowing barre/KB", "sets": 3, "reps": "8"},
  {"name": "Face pulls + leg raises (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('wednesday', 'Legs Athlétisme', '[
  {"name": "RDL unilatéral/trap bar deadlift", "sets": 3, "reps": "6"},
  {"name": "Box jumps", "sets": 4, "reps": "5"},
  {"name": "Lateral lunges", "sets": 3, "reps": "10/côté"},
  {"name": "Calf raises + mobilité cheville (superset)", "sets": 3, "reps": "-"}
]'::jsonb),
('thursday', 'Push (Dips) + KB', '[
  {"name": "Dips lestés", "sets": 5, "reps": "5"},
  {"name": "KB clean & press", "sets": 4, "reps": "8/côté"},
  {"name": "Pompes archer/développé militaire", "sets": 3, "reps": "10"},
  {"name": "Ab wheel/hollow body", "sets": 3, "reps": "-"}
]'::jsonb),
('friday', 'Full body + sprints', '[
  {"name": "KB complex", "sets": 5, "reps": "tours"},
  {"name": "Superset tractions/dips", "sets": 4, "reps": "-"},
  {"name": "Sprints 6x100m ou côte 8x20s", "sets": 1, "reps": "-"}
]'::jsonb),
('saturday', 'Course ou sport random', '[]'::jsonb),
('sunday', 'Repos', '[]'::jsonb);
