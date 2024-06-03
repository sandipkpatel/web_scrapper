Node: If you're not from the US please use a VPN with a US location because myhome.ge server will block IP.

Install Project Dependency
-------

```bash
npm install
```

Add google-chrome exe file path  in .env file
-------

```bash
EXE_PATH=(Add Path Here)
```

Add website url, startPage, endPage in input.json file
-------

```bash
[
    {
        "url": "https://www.myhome.ge/en/s/iyideba-bina-Tbilisshi/?deal_types=1&real_estate_types=1&cities=1&currency_id=1&CardView=2&urbans=47&districts=4&page=1",
        "startPage": 1,
        "endPage": 1
    },
    {
        "url": "https://www.myhome.ge/en/s/iyideba-bina-Tbilisshi/?deal_types=1&real_estate_types=1&cities=1&currency_id=1&CardView=2&urbans=47&districts=4&page=1",
        "startPage": 3,
        "endPage": 5
    }
]
```

Create folder in root direcotry
-------

```bash
/output
```

Run Backend Service
-------

```bash
node scraper.js
```

Initia Scraping Process
-------

```bash
http://localhost:8082/run
```




All unit info will be stored in output folder.
-------

```bash
/output/unit_id/
```
