#!/usr/bin/env python3
"""Create / update the Rucci wheels as quote-only products in the Shopify store.

  python3 import-products.py --dry            list what would be created
  python3 import-products.py --only casket    one wheel (by slug)
  python3 import-products.py                  all wheels
  python3 import-products.py --activate       set every Rucci product ACTIVE + template 'quote' (after the theme is ready)
  python3 import-products.py --meta-only      re-send metafields/tags/description for existing products

Products are created as DRAFT so the store never shows a $0 wheel before the quote
template is live. Idempotent: a product is matched by handle "rucci-<slug>".
Reads src/data/wheels.json (the Vercel site's catalog, images on Cloudinary) and the
store token from ../../../WBRorderfrom visualizer/env.txt.
"""
import json, os, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', '..', 'src', 'data', 'wheels.json')
ENV = os.path.join(HERE, '..', '..', '..', 'WBRorderfrom visualizer', 'env.txt')
env = {}
for l in open(ENV):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k] = v.strip().strip('"')
STORE = env['SHOPIFY_STORE_URL'].replace('https://', '').strip('/'); TOKEN = env['SHOPIFY_ACCESS_TOKEN']; APIVER = env.get('SHOPIFY_API_VERSION', '2024-10')
H = {'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json'}
ONLINE_STORE = 'gid://shopify/Publication/16503210028'
VENDOR, PTYPE, TEMPLATE = 'Rucci Forged', 'Rucci Forged', 'quote'
SIZES_TEXT = '19" to 34"'

def gql(q, v=None):
    for attempt in range(4):
        try:
            r = json.load(urllib.request.urlopen(urllib.request.Request(
                'https://%s/admin/api/%s/graphql.json' % (STORE, APIVER),
                data=json.dumps({'query': q, 'variables': v or {}}).encode(), headers=H), timeout=120))
        except Exception as e:
            time.sleep(2 + attempt * 2); continue
        if 'errors' in r:
            msg = json.dumps(r['errors'])
            if 'THROTTLED' in msg: time.sleep(3); continue
            raise RuntimeError(msg[:500])
        return r['data']
    raise RuntimeError('gql failed')

def find(handle):
    d = gql('{ productByHandle(handle:"%s"){ id status media(first:1){ edges{ node{ id } } } } }' % handle)
    return d['productByHandle']

def description(w):
    d = w['detail']; specs = d.get('specs', {})
    styles = specs.get('styles') or w['series']
    fin = specs.get('finish') or 'Chrome, Brushed, Black, 18K and 24K gold'
    return ('<p>%s</p>'
            '<p><strong>Custom forged, built to order.</strong> Sizes %s. Finishes: %s, or any custom colour. '
            'Center cap: %s. Style: %s. Bolt pattern drilled to your vehicle.</p>'
            '<p>Rucci Forged wheels are priced per build. Tell us your vehicle, size and finish and we will quote it.</p>'
            % (d.get('description', '').split(' *')[0], SIZES_TEXT, fin, specs.get('centerCap') or 'Large or Small', styles))

def product_input(w):
    d = w['detail']; specs = d.get('specs', {})
    styles = [s.strip() for s in (specs.get('styles') or w['series']).split(',') if s.strip()]
    tags = ['Rucci', 'Rucci Forged', 'quote-only', 'forged'] + ['style:' + s for s in styles]
    if d.get('isNew'): tags.append('new')
    metafields = [
        {'namespace': 'custom', 'key': 'quote_only', 'type': 'boolean', 'value': 'true'},
        {'namespace': 'custom', 'key': 'rucci_styles', 'type': 'list.single_line_text_field', 'value': json.dumps(styles)},
        # Cloudinary copy of the catalog photo: CORS-enabled, so the theme's approximate finish
        # preview can read its pixels (Shopify's CDN copy may not allow that).
        {'namespace': 'custom', 'key': 'rucci_image', 'type': 'url', 'value': w['imageUrl']},
    ]
    if d.get('variants'): metafields.append({'namespace': 'custom', 'key': 'rucci_variants', 'type': 'json', 'value': json.dumps(d['variants'])})
    if d.get('vehicles'): metafields.append({'namespace': 'custom', 'key': 'rucci_vehicles', 'type': 'json', 'value': json.dumps(d['vehicles'])})
    return {
        'title': 'Rucci Forged %s' % w['name'], 'handle': 'rucci-' + w['slug'],
        'vendor': VENDOR, 'productType': PTYPE, 'templateSuffix': TEMPLATE, 'status': 'DRAFT',
        'tags': tags, 'descriptionHtml': description(w), 'metafields': metafields,
        'seo': {'title': 'Rucci Forged %s custom forged wheel | Wheels Below Retail' % w['name'],
                'description': 'Rucci Forged %s, built to order in %s. Request a quote for your vehicle.' % (w['name'], SIZES_TEXT)},
    }

def create(w):
    handle = 'rucci-' + w['slug']
    ex = find(handle)
    pin = product_input(w)
    if ex:
        pin['id'] = ex['id']; pin.pop('status', None)
        d = gql('mutation($p: ProductInput!){ productUpdate(input:$p){ product{ id } userErrors{ field message } } }', {'p': pin})
        r = d['productUpdate']; pid = ex['id']; action = 'updated'
    else:
        d = gql('mutation($p: ProductInput!){ productCreate(input:$p){ product{ id variants(first:1){ edges{ node{ id inventoryItem{ id } } } } } userErrors{ field message } } }', {'p': pin})
        r = d['productCreate']; action = 'created'
    if r['userErrors']: raise RuntimeError('%s: %s' % (handle, r['userErrors']))
    pid = r['product']['id']
    if action == 'created':
        # $0 placeholder price, not purchasable: tracked inventory, zero stock, deny oversell
        v = r['product']['variants']['edges'][0]['node']
        gql('mutation($pid: ID!, $v: [ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$pid, variants:$v){ userErrors{ field message } } }',
            {'pid': pid, 'v': [{'id': v['id'], 'price': '0.00', 'inventoryPolicy': 'DENY', 'inventoryItem': {'tracked': True, 'requiresShipping': True}}]})
        # product photos (not the finish renders - those stay in the metafield for the picker)
        media = [{'originalSource': u, 'mediaContentType': 'IMAGE', 'alt': 'Rucci Forged %s' % w['name']} for u in [w['imageUrl']] + w['detail'].get('images', [])]
        d = gql('mutation($pid: ID!, $m: [CreateMediaInput!]!){ productCreateMedia(productId:$pid, media:$m){ mediaUserErrors{ field message } } }', {'pid': pid, 'm': media})
        if d['productCreateMedia']['mediaUserErrors']: print('   media errors:', d['productCreateMedia']['mediaUserErrors'])
        gql('mutation($id: ID!, $pub: [PublicationInput!]!){ publishablePublish(id:$id, input:$pub){ userErrors{ field message } } }', {'id': pid, 'pub': [{'publicationId': ONLINE_STORE}]})
    return action, pid

def main():
    wheels = json.load(open(DATA))
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    if only: wheels = [w for w in wheels if w['slug'] == only]
    if '--activate' in sys.argv:
        n = 0
        for w in wheels:
            ex = find('rucci-' + w['slug'])
            if ex:
                gql('mutation($p: ProductInput!){ productUpdate(input:$p){ userErrors{ field message } } }', {'p': {'id': ex['id'], 'status': 'ACTIVE', 'templateSuffix': TEMPLATE}}); n += 1
                time.sleep(0.3)
        print('activated', n); return
    if '--meta-only' in sys.argv:
        n = 0
        for w in wheels:
            ex = find('rucci-' + w['slug'])
            if not ex: continue
            pin = product_input(w); pin['id'] = ex['id']; pin.pop('status', None); pin.pop('handle', None); pin.pop('templateSuffix', None)
            r = gql('mutation($p: ProductInput!){ productUpdate(input:$p){ userErrors{ field message } } }', {'p': pin})['productUpdate']
            if r['userErrors']: print('  ', w['slug'], r['userErrors'])
            n += 1; time.sleep(0.4)
        print('metafields refreshed on', n); return
    if '--dry' in sys.argv:
        for w in wheels: print('would create rucci-%s | %s | %d photos | %d renders' % (w['slug'], w['name'], 1 + len(w['detail'].get('images', [])), len(w['detail'].get('variants', []))))
        return
    for i, w in enumerate(wheels, 1):
        action, pid = create(w)
        print('%3d/%d %s %s %s' % (i, len(wheels), action, 'rucci-' + w['slug'], pid))
        time.sleep(0.6)

if __name__ == '__main__':
    main()
