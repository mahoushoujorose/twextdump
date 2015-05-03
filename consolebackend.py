from flask import Flask
from flask import render_template
from flask import request
from flask.ext.tweepy import Tweepy
import json

# settings
STATUS_COUNT = 64

app = Flask(__name__)
app.config['DEBUG'] = True  # TODO remove this

app.config.setdefault('TWEEPY_CONSUMER_KEY', 'rQ9PjWZrHx4viVOhG6FKlrdpn')
app.config.setdefault('TWEEPY_CONSUMER_SECRET', 'yurjeLLYZqfNdJzpXYAVPK3YSk7ksVD3lVqtRqneF6LSHa3t68')
app.config.setdefault('TWEEPY_ACCESS_TOKEN_KEY', '3030976005-B7tGsPI3mtHaQ0Hh7HdoScGHkOm9GZX4I8siQBl')
app.config.setdefault('TWEEPY_ACCESS_TOKEN_SECRET', '70pw5WAk601gbYgvKEJze6Gfar6mT4Q4VzA4T4aeqjDMw')

tweepyapp = Tweepy(app)

@app.route("/")
def hello():
    return render_template('main.html')

@app.route("/tweets", methods=['GET'])
def pull_tweets():
    screen_name = request.args.get('screen_name')
    max_id = request.args.get('max_id')
    statuses = None
    if max_id:
        statuses = tweepyapp.api.user_timeline(screen_name=screen_name, max_id=max_id, count=STATUS_COUNT)
    else:
        statuses = tweepyapp.api.user_timeline(screen_name=screen_name, count=STATUS_COUNT)
    if statuses:
        # status attributes: 'author', 'contributors', 'coordinates', 'created_at',
        # 'destroy', 'entities', 'extended_entities', 'favorite', 'favorite_count',
        # 'favorited', 'geo', 'id', 'id_str', 'in_reply_to_screen_name',
        # 'in_reply_to_status_id', 'in_reply_to_status_id_str', 'in_reply_to_user_id',
        # 'in_reply_to_user_id_str', 'lang', 'parse', 'parse_list', 'place',
        # 'possibly_sensitive', 'retweet', 'retweet_count', 'retweeted',
        # 'retweeted_status', 'retweets', 'source', 'source_url', 'text', 'truncated','user'

        tweets = ""
        tweet_json = []
        for status in statuses:
            tweet = {}
            tweet['name'] = status.author.name
            tweet['screen_name'] = status.author.screen_name
            tweet['date'] = status.created_at.strftime('%x %X') # datetime
            tweet['text'] = status.text
            tweet['retweets'] = status.retweet_count
            tweet['favorites'] = status.favorite_count
            tweet['id_str'] = status.id_str

            #tweets += tweet['text'] + str(tweet['favorites']) + " | "
            tweet_json.append(tweet)
        return json.dumps(tweet_json)
    else:
        return json.dumps([])

if __name__ == "__main__":
    app.run()

