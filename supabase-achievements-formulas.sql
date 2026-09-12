-- RATHOD HUB: 50 Badge Library + solved-question stats + daily formula preference
-- Run once in Supabase SQL Editor only when this feature is ready to deploy.

create table if not exists public.user_learning_stats (user_id uuid primary key references public.profiles(id) on delete cascade,correct_answers integer not null default 0,updated_at timestamptz not null default now());
create table if not exists public.badge_catalog (badge_id text primary key,name text not null,icon text not null,unlock_type text not null check(unlock_type in ('question','xp')),question_requirement integer not null default 0,xp_price integer not null default 0,description text not null,tier text not null,active boolean not null default true);
insert into public.badge_catalog(badge_id,name,icon,unlock_type,question_requirement,xp_price,description,tier) values
('q01','First Spark','🌱','question',10,0,'Solve 10 correct questions','Starter'),
('q02','Quick Starter','⚡','question',25,0,'Solve 25 correct questions','Starter'),
('q03','Half Century','🎯','question',50,0,'Solve 50 correct questions','Starter'),
('q04','Momentum Maker','🚀','question',75,0,'Solve 75 correct questions','Starter'),
('q05','Question Hunter','🔍','question',100,0,'Solve 100 correct questions','Starter'),
('q06','Concept Scout','🧭','question',150,0,'Solve 150 correct questions','Starter'),
('q07','Practice Pilot','✈️','question',200,0,'Solve 200 correct questions','Pro'),
('q08','NCERT Ranger','📗','question',300,0,'Solve 300 correct questions','Pro'),
('q09','Accuracy Builder','🧠','question',400,0,'Solve 400 correct questions','Pro'),
('q10','Quiz Warrior','⚔️','question',500,0,'Solve 500 correct questions','Pro'),
('q11','Brain Charger','🔋','question',650,0,'Solve 650 correct questions','Pro'),
('q12','Revision Knight','🛡️','question',800,0,'Solve 800 correct questions','Pro'),
('q13','Thousand Solver','💯','question',1000,0,'Solve 1000 correct questions','Elite'),
('q14','Concept Captain','🧑‍✈️','question',1250,0,'Solve 1250 correct questions','Elite'),
('q15','NEET Striker','🏹','question',1500,0,'Solve 1500 correct questions','Elite'),
('q16','Question Master','🎓','question',1800,0,'Solve 1800 correct questions','Elite'),
('q17','NCERT Guardian','📚','question',2200,0,'Solve 2200 correct questions','Elite'),
('q18','Exam Explorer','🌌','question',2600,0,'Solve 2600 correct questions','Elite'),
('q19','Practice Titan','🗿','question',3000,0,'Solve 3000 correct questions','Elite'),
('q20','Mega Solver','🔥','question',3500,0,'Solve 3500 correct questions','Elite'),
('q21','Knowledge Ace','♠️','question',4000,0,'Solve 4000 correct questions','Elite'),
('q22','NEET Commander','⭐','question',5000,0,'Solve 5000 correct questions','Legend'),
('q23','Question Emperor','👑','question',6000,0,'Solve 6000 correct questions','Legend'),
('q24','Grand Scholar','💎','question',7500,0,'Solve 7500 correct questions','Legend'),
('q25','Ten-K Legend','🏆','question',10000,0,'Solve 10000 correct questions','Legend'),
('x01','Bronze Leaf','🍃','xp',0,100,'Premium XP collectible','Starter'),
('x02','Blue Orbit','🔵','xp',0,200,'Premium XP collectible','Starter'),
('x03','Focus Flame','🔥','xp',0,300,'Premium XP collectible','Starter'),
('x04','Bio Bloom','🌿','xp',0,400,'Premium XP collectible','Starter'),
('x05','Chem Spark','🧪','xp',0,500,'Premium XP collectible','Starter'),
('x06','Physics Pulse','⚛️','xp',0,650,'Premium XP collectible','Starter'),
('x07','NCERT Ink','✒️','xp',0,800,'Premium XP collectible','Starter'),
('x08','Streak Star','⭐','xp',0,1000,'Premium XP collectible','Pro'),
('x09','Quiz Nova','🌟','xp',0,1200,'Premium XP collectible','Pro'),
('x10','Study Samurai','🥷','xp',0,1500,'Premium XP collectible','Pro'),
('x11','Formula Fox','🦊','xp',0,1800,'Premium XP collectible','Pro'),
('x12','Doubt Slayer','🗡️','xp',0,2100,'Premium XP collectible','Pro'),
('x13','Time Traveller','⏳','xp',0,2500,'Premium XP collectible','Pro'),
('x14','Exemplar Elite','📘','xp',0,2800,'Premium XP collectible','Pro'),
('x15','Library Lion','🦁','xp',0,3200,'Premium XP collectible','Elite'),
('x16','Live Quiz Hero','🎮','xp',0,3500,'Premium XP collectible','Elite'),
('x17','Memory Architect','🏛️','xp',0,3800,'Premium XP collectible','Elite'),
('x18','Vault Keeper','🔐','xp',0,4000,'Premium XP collectible','Elite'),
('x19','Campus Mentor','🎙️','xp',0,4200,'Premium XP collectible','Elite'),
('x20','League Diamond','💎','xp',0,4400,'Premium XP collectible','Elite'),
('x21','NEET Phoenix','🐦‍🔥','xp',0,4600,'Premium XP collectible','Legend'),
('x22','Cosmic Scholar','🌌','xp',0,4700,'Premium XP collectible','Legend'),
('x23','Royal Aspirant','🤴','xp',0,4800,'Premium XP collectible','Legend'),
('x24','Elite Crown','👑','xp',0,4900,'Premium XP collectible','Legend'),
('x25','RATHOD Legend','🏆','xp',0,5000,'Premium XP collectible','Legend')
on conflict(badge_id) do update set name=excluded.name,icon=excluded.icon,unlock_type=excluded.unlock_type,question_requirement=excluded.question_requirement,xp_price=excluded.xp_price,description=excluded.description,tier=excluded.tier,active=true;

create table if not exists public.user_badges (user_id uuid not null references public.profiles(id) on delete cascade,badge_id text not null references public.badge_catalog(badge_id),earned_at timestamptz not null default now(),equipped boolean not null default false,primary key(user_id,badge_id));
create table if not exists public.daily_formula_preferences (user_id uuid primary key references public.profiles(id) on delete cascade,subject text not null check(subject in ('physics','chemistry')),delivery_time time not null default '07:00',updated_at timestamptz not null default now());

alter table public.user_learning_stats enable row level security; alter table public.badge_catalog enable row level security; alter table public.user_badges enable row level security; alter table public.daily_formula_preferences enable row level security;
drop policy if exists "stats own read" on public.user_learning_stats;
create policy "stats own read" on public.user_learning_stats for select to authenticated using(auth.uid()=user_id);
drop policy if exists "catalog read" on public.badge_catalog;
create policy "catalog read" on public.badge_catalog for select to authenticated using(active);
drop policy if exists "badges auth read" on public.user_badges;
create policy "badges auth read" on public.user_badges for select to authenticated using(true);
drop policy if exists "formula own read" on public.daily_formula_preferences;
create policy "formula own read" on public.daily_formula_preferences for select to authenticated using(auth.uid()=user_id);
grant select on public.user_learning_stats,public.badge_catalog,public.user_badges,public.daily_formula_preferences to authenticated;

create or replace function public.ensure_learning_stats() returns public.user_learning_stats language plpgsql security definer set search_path=public as $$
declare r public.user_learning_stats; total integer:=0;
begin if auth.uid() is null then raise exception 'Login required'; end if; select * into r from public.user_learning_stats where user_id=auth.uid(); if found then return r; end if;
 select coalesce((select count(*) from public.quiz_battle_answers where user_id=auth.uid() and is_correct),0)+coalesce((select count(*) from public.hub_daily_answers where user_id=auth.uid() and is_correct),0)+coalesce((select count(*) from public.treasure_hunt_answers where user_id=auth.uid() and is_correct),0)+coalesce((select sum(correct) from public.admin_test_attempts where user_id=auth.uid()),0) into total;
 insert into public.user_learning_stats(user_id,correct_answers) values(auth.uid(),total) returning * into r; return r; end $$;
create or replace function public.record_correct_answer(p_count integer default 1) returns integer language plpgsql security definer set search_path=public as $$ declare r public.user_learning_stats; begin r:=public.ensure_learning_stats(); update public.user_learning_stats set correct_answers=correct_answers+greatest(1,least(coalesce(p_count,1),100)),updated_at=now() where user_id=auth.uid() returning correct_answers into r.correct_answers; return r.correct_answers; end $$;
create or replace function public.claim_question_badge(p_badge_id text) returns boolean language plpgsql security definer set search_path=public as $$ declare b public.badge_catalog;s public.user_learning_stats;begin s:=public.ensure_learning_stats();select * into b from public.badge_catalog where badge_id=p_badge_id and unlock_type='question' and active;if not found then raise exception 'Badge not found';end if;if s.correct_answers<b.question_requirement then raise exception 'More questions required';end if;insert into public.user_badges(user_id,badge_id) values(auth.uid(),p_badge_id) on conflict do nothing;return true;end $$;
create or replace function public.buy_xp_badge(p_badge_id text) returns integer language plpgsql security definer set search_path=public as $$ declare b public.badge_catalog;bal integer;begin select * into b from public.badge_catalog where badge_id=p_badge_id and unlock_type='xp' and active;if not found then raise exception 'Badge not found';end if;if exists(select 1 from public.user_badges where user_id=auth.uid() and badge_id=p_badge_id) then raise exception 'Already owned';end if;select coalesce(xp,0)::integer into bal from public.profiles where id=auth.uid() for update;if bal<b.xp_price then raise exception 'Not enough XP';end if;update public.profiles set xp=bal-b.xp_price where id=auth.uid();insert into public.user_badges(user_id,badge_id) values(auth.uid(),p_badge_id);return bal-b.xp_price;end $$;
create or replace function public.toggle_showcase_badge(p_badge_id text) returns boolean language plpgsql security definer set search_path=public as $$ declare cur boolean;begin select equipped into cur from public.user_badges where user_id=auth.uid() and badge_id=p_badge_id;if not found then raise exception 'Badge not owned';end if;if not cur and (select count(*) from public.user_badges where user_id=auth.uid() and equipped)>=5 then raise exception 'Maximum 5 showcase badges';end if;update public.user_badges set equipped=not cur where user_id=auth.uid() and badge_id=p_badge_id;return not cur;end $$;
create or replace function public.save_daily_formula_preference(p_subject text,p_time time) returns public.daily_formula_preferences language plpgsql security definer set search_path=public as $$ declare r public.daily_formula_preferences;begin if p_subject not in ('physics','chemistry') then raise exception 'Invalid subject';end if;insert into public.daily_formula_preferences(user_id,subject,delivery_time) values(auth.uid(),p_subject,p_time) on conflict(user_id) do update set subject=excluded.subject,delivery_time=excluded.delivery_time,updated_at=now() returning * into r;return r;end $$;
grant execute on function public.ensure_learning_stats(),public.record_correct_answer(integer),public.claim_question_badge(text),public.buy_xp_badge(text),public.toggle_showcase_badge(text),public.save_daily_formula_preference(text,time) to authenticated;
