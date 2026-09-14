-- RATHOD HUB rare XP shop expansion
-- Run once in Supabase SQL Editor after supabase-profile-experience.sql.

insert into public.rh_shop_items(item_id,name,kind,emoji,price,description,tier,active) values
 ('avatar_rare_doctor_f','Rare Lady Doctor','avatar','👩‍⚕️',5000,'Rare female doctor avatar • profile photo replacement','Rare',true),
 ('avatar_rare_scientist_f','Rare Lady Scientist','avatar','👩‍🔬',6500,'Rare female research avatar • profile photo replacement','Rare+',true),
 ('avatar_rare_queen_f','Royal NEET Queen','avatar','👸',9000,'Royal female avatar for elite NEET aspirants','Mythic',true),
 ('badge_rare_medal','NEET Gold Medal','badge','🥇',6000,'Equippable rare medal shown after your name','Rare',true),
 ('badge_rare_bundle','Royal Scholar Bundle','badge','👑💎',8000,'Rare crown and diamond name bundle','Mythic',true),
 ('badge_rare_legend','RATHOD Supreme Medal','badge','🏅',10000,'Highest rarity profile medal and name badge','Legendary',true)
on conflict(item_id) do update set
 name=excluded.name,kind=excluded.kind,emoji=excluded.emoji,price=excluded.price,
 description=excluded.description,tier=excluded.tier,active=true;
