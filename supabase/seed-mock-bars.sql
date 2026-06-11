-- Bora Bar - bares iniciais para o Supabase
-- Rode depois de `supabase/schema.sql`.

with seed as (
  select *
  from jsonb_to_recordset($bars$
[
    {
      "id": "esquina-77",
      "name": "Esquina 77",
      "neighborhood": "Vila Santa Cecilia",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 0.8,
      "latitude": -22.51965,
      "longitude": -44.10398,
      "is_active": true,
      "is_open": true,
      "price_level": "$$",
      "promotion": "Chopp em dobro até 20h",
      "address": "Rua 33, 77 - Vila Santa Cecilia, Volta Redonda",
      "hours": "Seg a qui: 17h-00h | Sex e sab: 17h-02h | Dom: 16h-23h",
      "phone": "(11) 95555-0177",
      "description": "Bar de esquina com mesas na calçada, chopp gelado e porções clássicas para dividir.",
      "menu": {
        "cervejas": [
          {
            "name": "Chopp Pilsen 300ml",
            "price": 9.9
          },
          {
            "name": "IPA long neck",
            "price": 18
          },
          {
            "name": "Lager artesanal 600ml",
            "price": 24.9
          }
        ],
        "drinks": [
          {
            "name": "Caipirinha de limao",
            "price": 18
          },
          {
            "name": "Gin tonica classico",
            "price": 26
          },
          {
            "name": "Moscow mule",
            "price": 29
          }
        ],
        "porcoes": [
          {
            "name": "Batata rustica",
            "price": 28
          },
          {
            "name": "Isca de frango",
            "price": 34
          },
          {
            "name": "Dadinho de tapioca",
            "price": 31
          }
        ],
        "combos": [
          {
            "name": "2 chopps + batata",
            "price": 42
          },
          {
            "name": "Balde 6 long necks",
            "price": 79
          }
        ]
      }
    },
    {
      "id": "boteco-do-porto",
      "name": "Boteco do Porto",
      "neighborhood": "Aterrado",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 1.9,
      "latitude": -22.51028,
      "longitude": -44.09478,
      "is_active": true,
      "is_open": true,
      "price_level": "$",
      "promotion": "Combo pastel + cerveja por R$ 29",
      "address": "Rua 14, 420 - Aterrado, Volta Redonda",
      "hours": "Ter a dom: 15h-01h",
      "phone": "(11) 94444-2090",
      "description": "Clima simples, preço amigo e cardápio direto ao ponto para happy hour sem complicação.",
      "menu": {
        "cervejas": [
          {
            "name": "Pilsen lata",
            "price": 7.5
          },
          {
            "name": "Garrafa 600ml",
            "price": 14
          },
          {
            "name": "Chopp claro 300ml",
            "price": 8.9
          }
        ],
        "drinks": [
          {
            "name": "Caipiroska",
            "price": 16
          },
          {
            "name": "Cuba libre",
            "price": 17
          },
          {
            "name": "Aperol spritz",
            "price": 24
          }
        ],
        "porcoes": [
          {
            "name": "Pastel misto 6 unidades",
            "price": 26
          },
          {
            "name": "Mandioca frita",
            "price": 24
          },
          {
            "name": "Bolinho de carne",
            "price": 29
          }
        ],
        "combos": [
          {
            "name": "3 garrafas 600ml",
            "price": 39
          },
          {
            "name": "Pastel + 2 latas",
            "price": 29
          }
        ]
      }
    },
    {
      "id": "varanda-aurora",
      "name": "Varanda Aurora",
      "neighborhood": "Jardim Amalia",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 1.1,
      "latitude": -22.51692,
      "longitude": -44.11322,
      "is_active": true,
      "is_open": false,
      "price_level": "$$$",
      "promotion": "",
      "address": "Rua Paulo de Frontin, 1200 - Jardim Amalia, Volta Redonda",
      "hours": "Qua a sab: 18h-02h | Dom: 12h-18h",
      "phone": "(31) 98888-1200",
      "description": "Varanda arejada, cozinha de bar autoral e carta de drinks para noites mais longas.",
      "menu": {
        "cervejas": [
          {
            "name": "Pilsen artesanal 500ml",
            "price": 22
          },
          {
            "name": "Witbier 500ml",
            "price": 25
          },
          {
            "name": "Stout 355ml",
            "price": 21
          }
        ],
        "drinks": [
          {
            "name": "Negroni",
            "price": 32
          },
          {
            "name": "Gin com frutas vermelhas",
            "price": 34
          },
          {
            "name": "Margarita",
            "price": 30
          }
        ],
        "porcoes": [
          {
            "name": "Croquete de costela",
            "price": 42
          },
          {
            "name": "Queijo coalho com melaço",
            "price": 35
          },
          {
            "name": "Mini burgers",
            "price": 48
          }
        ],
        "combos": [
          {
            "name": "2 drinks + croquete",
            "price": 92
          },
          {
            "name": "Degustacao de cervejas",
            "price": 65
          }
        ]
      }
    },
    {
      "id": "marola-bar",
      "name": "Marola Bar",
      "neighborhood": "Retiro",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1538488881038-e252a119ace7?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 3,
      "latitude": -22.49782,
      "longitude": -44.10635,
      "is_active": true,
      "is_open": true,
      "price_level": "$$",
      "promotion": "Caipirinha de frutas com 25% off",
      "address": "Av. Savio Gama, 1888 - Retiro, Volta Redonda",
      "hours": "Todos os dias: 16h-01h",
      "phone": "(81) 97777-1888",
      "description": "Bar descontraído perto da praia, com petiscos de frutos do mar e drinks tropicais.",
      "menu": {
        "cervejas": [
          {
            "name": "Long neck premium",
            "price": 13
          },
          {
            "name": "Chopp 400ml",
            "price": 14.5
          },
          {
            "name": "Balde 4 long necks",
            "price": 46
          }
        ],
        "drinks": [
          {
            "name": "Caipirinha de cajá",
            "price": 19
          },
          {
            "name": "Mojito",
            "price": 24
          },
          {
            "name": "Piña colada",
            "price": 27
          }
        ],
        "porcoes": [
          {
            "name": "Isca de peixe",
            "price": 39
          },
          {
            "name": "Camarão alho e óleo",
            "price": 58
          },
          {
            "name": "Macaxeira frita",
            "price": 25
          }
        ],
        "combos": [
          {
            "name": "Balde + macaxeira",
            "price": 64
          },
          {
            "name": "2 mojitos + isca",
            "price": 79
          }
        ]
      }
    },
    {
      "id": "quintal-boa-prosa",
      "name": "Quintal Boa Prosa",
      "neighborhood": "Centro",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 0.6,
      "latitude": -22.52346,
      "longitude": -44.10391,
      "is_active": true,
      "is_open": false,
      "price_level": "$$",
      "promotion": "Música ao vivo sem couvert às quintas",
      "address": "Rua Gustavo Lira, 310 - Centro, Volta Redonda",
      "hours": "Qui a sab: 17h-02h | Dom: 13h-21h",
      "phone": "(41) 96666-0310",
      "description": "Quintal urbano com mesas coletivas, cervejas locais e porções bem servidas.",
      "menu": {
        "cervejas": [
          {
            "name": "Lager local 473ml",
            "price": 17
          },
          {
            "name": "Session IPA 473ml",
            "price": 22
          },
          {
            "name": "Chopp escuro 300ml",
            "price": 13
          }
        ],
        "drinks": [
          {
            "name": "Rabo de galo",
            "price": 20
          },
          {
            "name": "Gin tonica da casa",
            "price": 28
          },
          {
            "name": "Spritz de maracujá",
            "price": 26
          }
        ],
        "porcoes": [
          {
            "name": "Linguiça artesanal",
            "price": 36
          },
          {
            "name": "Polenta frita",
            "price": 27
          },
          {
            "name": "Tábua de frios",
            "price": 52
          }
        ],
        "combos": [
          {
            "name": "2 lagers + polenta",
            "price": 55
          },
          {
            "name": "Tábua + garrafa de vinho",
            "price": 118
          }
        ]
      }
    },
    {
      "id": "samba-da-rua",
      "name": "Samba da Rua",
      "neighborhood": "Conforto",
      "city": "Volta Redonda",
      "image_url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80",
      "distance_km": 2.3,
      "latitude": -22.52694,
      "longitude": -44.08384,
      "is_active": true,
      "is_open": true,
      "price_level": "$$",
      "promotion": "",
      "address": "Rua Sessenta, 91 - Conforto, Volta Redonda",
      "hours": "Qua a dom: 18h-03h",
      "phone": "(21) 93333-0091",
      "description": "Boteco musical com roda de samba, cerveja bem gelada e cozinha brasileira.",
      "menu": {
        "cervejas": [
          {
            "name": "Garrafa 600ml",
            "price": 17
          },
          {
            "name": "Chopp claro 300ml",
            "price": 10
          },
          {
            "name": "Malzbier long neck",
            "price": 12
          }
        ],
        "drinks": [
          {
            "name": "Caipirinha tradicional",
            "price": 20
          },
          {
            "name": "Batida de coco",
            "price": 18
          },
          {
            "name": "Jorge Amado",
            "price": 24
          }
        ],
        "porcoes": [
          {
            "name": "Feijoada aperitivo",
            "price": 44
          },
          {
            "name": "Bolinho de feijoada",
            "price": 35
          },
          {
            "name": "Torresmo crocante",
            "price": 33
          }
        ],
        "combos": [
          {
            "name": "Feijoada + 2 chopps",
            "price": 62
          },
          {
            "name": "4 caipirinhas",
            "price": 70
          }
        ]
      }
    }
  ]
$bars$::jsonb) as bar(
    id text,
    name text,
    neighborhood text,
    city text,
    image_url text,
    distance_km numeric,
    latitude numeric,
    longitude numeric,
    is_active boolean,
    is_open boolean,
    price_level text,
    promotion text,
    address text,
    hours text,
    phone text,
    description text,
    menu jsonb
  )
)
insert into public.bars (
  id,
  name,
  neighborhood,
  city,
  image_url,
  distance_km,
  latitude,
  longitude,
  is_active,
  is_open,
  price_level,
  promotion,
  address,
  hours,
  phone,
  description,
  menu
)
select
  id,
  name,
  neighborhood,
  city,
  image_url,
  distance_km,
  latitude,
  longitude,
  is_active,
  is_open,
  price_level,
  promotion,
  address,
  hours,
  phone,
  description,
  menu
from seed
on conflict (id) do update set
  name = excluded.name,
  neighborhood = excluded.neighborhood,
  city = excluded.city,
  image_url = excluded.image_url,
  distance_km = excluded.distance_km,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = excluded.is_active,
  is_open = excluded.is_open,
  price_level = excluded.price_level,
  promotion = excluded.promotion,
  address = excluded.address,
  hours = excluded.hours,
  phone = excluded.phone,
  description = excluded.description,
  menu = excluded.menu,
  updated_at = now();
