Feature: test case

    Scenario: scroll
       Given goto 'https://www.google.ru/search?q=nodejs+string+to+stream&rlz=1C1CHZL_ruRU700RU700&oq=nodejs+string+to+stream&aqs=chrome..69i57j0l5.8383j0j7&sourceid=chrome&ie=UTF-8'
        Then capture '[id="navcnt"]'

    Scenario: straight
       Given goto 'https://www.google.ru'
        Then capture '[id="body"]'
