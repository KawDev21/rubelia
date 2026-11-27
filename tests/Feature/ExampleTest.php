<?php

test('root redirects guests directly to login screen', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect(route('login'));
});
