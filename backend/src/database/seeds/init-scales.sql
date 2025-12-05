-- 初始化量表配置数据
-- 删除现有数据(如果存在)
DELETE FROM scale_configs WHERE code IN ('AIS', 'ESS', 'GAD7', 'PHQ9', 'HAMA', 'HAMD');

-- 1. AIS - 雅典失眠量表 (患者自评)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'AIS',
  '雅典失眠量表',
  'self',
  8,
  24,
  '[
    {"question":"入睡困难","options":[{"label":"没有问题","value":0},{"label":"有点延迟","value":1},{"label":"明显延迟","value":2},{"label":"很难入睡或根本睡不着","value":3}]},
    {"question":"夜间苏醒","options":[{"label":"没有问题","value":0},{"label":"有点问题","value":1},{"label":"明显问题","value":2},{"label":"严重问题或根本睡不着","value":3}]},
    {"question":"比期望的起床时间早","options":[{"label":"不早","value":0},{"label":"早一点","value":1},{"label":"明显早","value":2},{"label":"早很多或根本睡不着","value":3}]},
    {"question":"总的睡眠时间","options":[{"label":"足够","value":0},{"label":"稍有不足","value":1},{"label":"明显不足","value":2},{"label":"很不足或根本睡不着","value":3}]},
    {"question":"总的睡眠质量","options":[{"label":"满意","value":0},{"label":"稍不满意","value":1},{"label":"明显不满意","value":2},{"label":"很不满意或根本睡不着","value":3}]},
    {"question":"白天的情绪","options":[{"label":"正常","value":0},{"label":"稍低","value":1},{"label":"明显低","value":2},{"label":"非常低","value":3}]},
    {"question":"白天身体和脑力活动能力","options":[{"label":"正常","value":0},{"label":"稍低","value":1},{"label":"明显低","value":2},{"label":"非常低","value":3}]},
    {"question":"白天嗜睡","options":[{"label":"没有","value":0},{"label":"有点","value":1},{"label":"明显","value":2},{"label":"很严重","value":3}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":5,"level":"无失眠","description":"睡眠正常"},{"min":6,"max":10,"level":"可疑失眠","description":"轻度失眠"},{"min":11,"max":15,"level":"临床失眠","description":"中度失眠"},{"min":16,"max":24,"level":"严重失眠","description":"重度失眠"}]}'::jsonb,
  '["V1", "V2", "V3"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 2. ESS - Epworth嗜睡量表 (患者自评)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'ESS',
  'Epworth嗜睡量表',
  'self',
  8,
  24,
  '[
    {"question":"坐着阅读时","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"看电视时","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"在公共场所坐着不活动时（如在剧院或开会）","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"连续坐车超过1小时（不包括自己驾车）","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"情况允许时，下午躺下休息","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"坐着与人交谈时","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"午饭后（无饮酒）安静地坐着时","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]},
    {"question":"开车时遇到交通堵塞停车数分钟","options":[{"label":"从不打瞌睡","value":0},{"label":"轻微可能打瞌睡","value":1},{"label":"中度可能打瞌睡","value":2},{"label":"非常可能打瞌睡","value":3}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":5,"level":"嗜睡程度偏低","description":"正常范围"},{"min":6,"max":10,"level":"嗜睡程度中等","description":"轻度嗜睡"},{"min":11,"max":15,"level":"嗜睡程度偏高","description":"中度嗜睡"},{"min":16,"max":24,"level":"嗜睡程度过高","description":"重度嗜睡"}]}'::jsonb,
  '["V1", "V2", "V3"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 3. GAD7 - 广泛性焦虑障碍量表 (患者自评)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'GAD7',
  '广泛性焦虑障碍量表',
  'self',
  7,
  21,
  '[
    {"question":"感觉紧张、焦虑或急切","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"不能够停止或控制担忧","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"对各种各样的事情担忧过多","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"很难放松下来","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"由于不安而无法静坐","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"变得容易烦恼或急躁","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"感到似乎将有可怕的事情发生而害怕","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":4,"level":"无焦虑","description":"正常范围"},{"min":5,"max":9,"level":"轻度焦虑","description":"轻度焦虑症状"},{"min":10,"max":14,"level":"中度焦虑","description":"中度焦虑症状"},{"min":15,"max":21,"level":"重度焦虑","description":"严重焦虑症状"}]}'::jsonb,
  '["V1", "V2"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 4. PHQ9 - 抑郁症筛查量表 (患者自评)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'PHQ9',
  '抑郁症筛查量表',
  'self',
  9,
  27,
  '[
    {"question":"做事时提不起劲或没有兴趣","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"感到心情低落、沮丧或绝望","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"入睡困难、睡不安稳或睡得过多","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"感到疲倦或没有精力","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"食欲不振或吃得过多","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"觉得自己很糟或觉得自己很失败，或让自己和家人失望","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"对事物专注有困难，例如读报纸或看电视时","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"动作或说话速度缓慢到别人已经察觉？或正好相反——烦躁或坐立不安、动来动去的情况更胜于平常","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]},
    {"question":"有不如死掉或用某种方式伤害自己的想法","options":[{"label":"完全不会","value":0},{"label":"好几天","value":1},{"label":"一半以上的天数","value":2},{"label":"几乎每天","value":3}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":4,"level":"无抑郁","description":"正常范围"},{"min":5,"max":9,"level":"轻度抑郁","description":"轻度抑郁症状"},{"min":10,"max":14,"level":"中度抑郁","description":"中度抑郁症状"},{"min":15,"max":19,"level":"中重度抑郁","description":"中重度抑郁症状"},{"min":20,"max":27,"level":"重度抑郁","description":"重度抑郁症状"}]}'::jsonb,
  '["V1", "V2"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 5. HAMA - 汉密尔顿焦虑量表 (医生评定)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'HAMA',
  '汉密尔顿焦虑量表',
  'doctor',
  14,
  56,
  '[
    {"question":"焦虑心境：担心、预感最坏的事将临头、易激惹","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"紧张：紧张感、易疲乏、不能放松、情绪反应、易哭、颤抖、感到不安","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"害怕：害怕黑暗、陌生人、一人独处、动物、乘车或旅行及人群","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"失眠：难以入睡、睡得不深、早醒、夜醒、恶梦、夜惊、醒后感疲倦","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"认知功能：或称记忆、注意障碍。注意力不能集中、记忆力差","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"抑郁心境：丧失兴趣、对以往爱好缺乏快感、抑郁、早醒、昼重夜轻","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"肌肉系统症状：肌肉酸痛、肌肉僵直、肌肉抽动、牙齿打颤、声音发抖","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"感觉系统症状：耳鸣、视物模糊、潮热或寒战、软弱无力感、刺痛感","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"心血管系统症状：心动过速、心悸、胸痛、血管跳动感、昏倒感、心搏脱漏","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"呼吸系统症状：胸闷、窒息感、叹息、呼吸困难","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"胃肠道症状：吞咽困难、嗳气、消化不良、腹痛、胃部烧灼感、腹胀、恶心、呕吐、便秘、腹泻、体重减轻","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"生殖泌尿系统症状：尿频、尿急、闭经、性冷淡、早泄、阳痿","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"自主神经系统症状：口干、潮红、苍白、易出汗、起鸡皮疙瘩、紧张性头痛","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]},
    {"question":"会谈时行为表现：紧张、不能松弛、忐忑不安、双手颤动、皱眉、面肌抽搐、吞咽、脸色苍白、呼吸急促、面色潮红等","options":[{"label":"无症状","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"极重度","value":4}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":6,"level":"无焦虑","description":"正常范围"},{"min":7,"max":14,"level":"可能有焦虑","description":"轻度焦虑"},{"min":15,"max":21,"level":"肯定有焦虑","description":"中度焦虑"},{"min":22,"max":29,"level":"明显焦虑","description":"重度焦虑"},{"min":30,"max":56,"level":"严重焦虑","description":"极重度焦虑"}]}'::jsonb,
  '["V1", "V3"]'::jsonb,
  'active',
  NOW(),
  NOW()
);

-- 6. HAMD - 汉密尔顿抑郁量表 (医生评定)
INSERT INTO scale_configs (code, name, type, total_items, max_score, questions, scoring_rules, stages, status, created_at, updated_at)
VALUES (
  'HAMD',
  '汉密尔顿抑郁量表',
  'doctor',
  17,
  54,
  '[
    {"question":"抑郁情绪","options":[{"label":"无","value":0},{"label":"只在问及时才诉述","value":1},{"label":"在交谈中自发地表达","value":2},{"label":"不用言语也可从表情、姿势、声音或欲哭中流露出这种情绪","value":3},{"label":"病人的自发言语和非言语表达几乎完全表现为这种情绪","value":4}]},
    {"question":"有罪感","options":[{"label":"无","value":0},{"label":"责备自己，感到自己连累他人","value":1},{"label":"认为自己犯了罪，或反复思考以往的过失和错误","value":2},{"label":"认为目前的疾病是一种惩罚，有罪恶妄想","value":3},{"label":"听到控告自己的或谴责自己的声音，和/或有威胁性的幻觉","value":4}]},
    {"question":"自杀","options":[{"label":"无","value":0},{"label":"觉得活着没意思","value":1},{"label":"希望自己已经死去，或常想到与死有关的事","value":2},{"label":"有自杀的观念或做出姿态","value":3},{"label":"有严重的自杀行为","value":4}]},
    {"question":"入睡困难","options":[{"label":"无","value":0},{"label":"偶有入睡困难，即上床后半小时以上才能入睡","value":1},{"label":"每晚均有入睡困难","value":2}]},
    {"question":"睡眠不深","options":[{"label":"无","value":0},{"label":"睡眠浅、易惊醒","value":1},{"label":"整夜辗转不眠","value":2}]},
    {"question":"早醒","options":[{"label":"无","value":0},{"label":"早醒，但能再入睡","value":1},{"label":"早醒后不能再入睡","value":2}]},
    {"question":"工作和兴趣","options":[{"label":"无","value":0},{"label":"思想和感到能力减退、不能集中注意力、做事犹豫不决","value":1},{"label":"对业余活动或工作明显缺乏兴趣","value":2},{"label":"生产能力下降","value":3},{"label":"由于目前疾病而停止工作","value":4}]},
    {"question":"阻滞（思维和言语缓慢，注意力难集中，自觉活动能力减退）","options":[{"label":"无","value":0},{"label":"交谈中略有迟钝","value":1},{"label":"交谈中明显迟钝","value":2},{"label":"交谈困难","value":3},{"label":"完全木僵","value":4}]},
    {"question":"激越（不安、小动作多）","options":[{"label":"无","value":0},{"label":"有些不安","value":1},{"label":"明显不安，玩弄手指","value":2},{"label":"不能静坐，摸索不停","value":3},{"label":"扭手顿足，咬指甲，扯头发，咬嘴唇","value":4}]},
    {"question":"精神性焦虑","options":[{"label":"无","value":0},{"label":"主观上紧张和易激惹","value":1},{"label":"为小事担忧","value":2},{"label":"担心的态度在面容或言谈中流露","value":3},{"label":"不问就自诉恐惧","value":4}]},
    {"question":"躯体性焦虑（焦虑的生理伴随症状）","options":[{"label":"无","value":0},{"label":"轻度","value":1},{"label":"中度","value":2},{"label":"重度","value":3},{"label":"失能","value":4}]},
    {"question":"胃肠道症状","options":[{"label":"无","value":0},{"label":"食欲减退，但无需他人鼓励即主动进食","value":1},{"label":"进食需他人催促，或要求并接受通便剂或助消化药","value":2}]},
    {"question":"全身症状","options":[{"label":"无","value":0},{"label":"四肢、背部或头部沉重感，背痛、头痛、肌肉痛，精力丧失或易疲劳","value":1},{"label":"任何明确症状均评2分","value":2}]},
    {"question":"性症状（如性欲减退、月经紊乱）","options":[{"label":"无","value":0},{"label":"轻度","value":1},{"label":"重度","value":2}]},
    {"question":"疑病","options":[{"label":"无","value":0},{"label":"对身体过分关注","value":1},{"label":"反复思虑健康问题","value":2},{"label":"有疑病妄想","value":3},{"label":"疑病妄想伴幻觉","value":4}]},
    {"question":"体重减轻","options":[{"label":"无","value":0},{"label":"可能有体重减轻","value":1},{"label":"明确的体重减轻","value":2}]},
    {"question":"自知力","options":[{"label":"认识到自己有病，是抑郁症或精神病","value":0},{"label":"认识到自己有病，但归咎于伙食不好、气候、工作过度、病毒感染等","value":1},{"label":"完全否认有病","value":2}]}
  ]'::jsonb,
  '{"ranges":[{"min":0,"max":7,"level":"无抑郁","description":"正常范围"},{"min":8,"max":16,"level":"轻度抑郁","description":"轻度抑郁症状"},{"min":17,"max":24,"level":"中度抑郁","description":"中度抑郁症状"},{"min":25,"max":54,"level":"重度抑郁","description":"重度抑郁症状"}]}'::jsonb,
  '["V1", "V3"]'::jsonb,
  'active',
  NOW(),
  NOW()
);
